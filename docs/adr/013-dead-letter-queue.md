# ADR-013: Dead Letter Queue Pattern (BullMQ DLQ)

## Status: Accepted
## Date: 2026-03-10

## Context

O sistema processa jobs assíncronos em cinco filas BullMQ: `notifications`, `emails`, `email-sync`, `audit-logs` e `reports`. Todos os jobs são configurados com 3 tentativas e backoff exponencial de 5 segundos.

Sem uma estratégia para jobs que esgotam todas as tentativas, o comportamento padrão do BullMQ é manter o job na fila como `failed`. Isso apresenta os seguintes problemas:

- **Visibilidade zero**: Jobs falhos ficam acumulados em Redis sem alertas ativos.
- **Ausência de rastreabilidade**: Não é possível saber de qual fila um job veio, qual erro ocorreu e quantas tentativas foram feitas.
- **Sem caminho de recuperação**: Não existe mecanismo para reprocessar manualmente um job falho depois de corrigir a causa raiz.
- **Acúmulo silencioso**: Em produção, erros permanentes em jobs de email sync podem acumular centenas de entradas `failed` sem notificação.

## Decision

Implementar uma **Dead Letter Queue (DLQ)** dedicada usando uma fila BullMQ separada chamada `dead-letter`, com as seguintes características:

### Fluxo de Encaminhamento

Quando um job falha pela última tentativa (`attemptsMade >= attempts`), o worker captura o evento `failed` e encaminha automaticamente para a DLQ:

```typescript
worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts?.attempts ?? defaultJobOptions.attempts)) {
    const dlq = createQueue(QUEUE_NAMES.DEAD_LETTER);
    await dlq.add('dead-letter', {
      originalQueue: name,
      originalJobId: job.id,
      originalJobName: job.name,
      data: job.data,
      lastError: err.message,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade,
    });

    captureMessage(`DLQ: Job failed permanently in "${name}"`, 'warning', {
      queue: name,
      jobId: job.id,
      error: err.message,
      attempts: job.attemptsMade,
    });
  }
});
```

### Envelope do Job na DLQ

Cada job na DLQ preserva o contexto completo para diagnóstico e reprocessamento:

| Campo | Descrição |
|-------|-----------|
| `originalQueue` | Nome da fila de origem (ex: `emails`) |
| `originalJobId` | ID do job original no Redis |
| `originalJobName` | Nome do job (ex: `send-email`) |
| `data` | Payload original do job |
| `lastError` | Mensagem do último erro |
| `failedAt` | ISO timestamp da falha definitiva |
| `attempts` | Número de tentativas realizadas |

### Alertas Automáticos

Cada encaminhamento para a DLQ dispara um `captureMessage` no Sentry com severidade `warning`, garantindo que a equipe seja notificada de falhas permanentes sem intervenção manual.

### Listagem de Jobs na DLQ

```typescript
// src/lib/queue.ts
export async function listDeadLetterJobs(limit = 50): Promise<DLQJob[]> {
  const dlq = createQueue(QUEUE_NAMES.DEAD_LETTER);
  const jobs = await dlq.getWaiting(0, limit - 1);
  return jobs.map((job) => ({ id: job.id, ...job.data }));
}
```

### Reprocessamento Manual

```typescript
export async function retryDeadLetterJob(jobId: string): Promise<boolean> {
  const dlq = createQueue(QUEUE_NAMES.DEAD_LETTER);
  const job = await dlq.getJob(jobId);
  if (!job) return false;

  const { originalQueue, data } = job.data;
  const targetQueue = createQueue(originalQueue);
  await targetQueue.add(originalQueue, data);
  await job.remove();

  return true;
}
```

### Retenção na DLQ

Jobs na DLQ são mantidos com `removeOnFail: { count: 5000, age: 7 * 24 * 60 * 60 }` (7 dias, máximo 5.000 entradas). Jobs na DLQ não tentam retries automaticamente — permanecem aguardando intervenção humana ou chamada a `retryDeadLetterJob`.

### Filas e seus Comportamentos

| Fila | Tentativas | Backoff Base | DLQ? |
|------|-----------|-------------|------|
| `notifications` | 3 | 5s exponencial | Sim |
| `emails` | 3 | 5s exponencial | Sim |
| `email-sync` | 3 | 5s exponencial | Sim |
| `audit-logs` | 3 | 5s exponencial | Sim |
| `reports` | 3 | 5s exponencial | Sim |
| `dead-letter` | — (sem retry) | — | N/A |

## Consequences

**Positive:**
- Jobs que falham definitivamente não são silenciados — sempre geram alerta no Sentry.
- O payload original é preservado integralmente, permitindo reprocessamento sem reconstrução manual dos dados.
- A fila `dead-letter` pode ser monitorada via dashboard BullMQ ou pela API `listDeadLetterJobs`.
- Falhas em encaminhar para a DLQ (ex: Redis indisponível) são logadas mas não propagam exceção — o comportamento é fail-open.

**Negative:**
- O encaminhamento para a DLQ é feito no evento `failed` do worker, que é disparado após cada tentativa individual, não apenas após a última. A lógica de verificação `attemptsMade >= attempts` depende da configuração padrão (`defaultJobOptions.attempts = 3`). Se um job usar opções personalizadas com número diferente de tentativas, o encaminhamento pode ocorrer prematuramente ou não ocorrer.
- A DLQ não tem worker associado — jobs nela são processados apenas via intervenção manual (`retryDeadLetterJob`). Não há reprocessamento automático por fila.
- A fila `dead-letter` não tem concurrency limiter configurado; um burst de reprocessamentos simultâneos pode sobrecarregar a fila de destino.
