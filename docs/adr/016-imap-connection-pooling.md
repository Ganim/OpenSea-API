# ADR-016: IMAP Connection Pooling

## Status: Accepted
## Date: 2026-03-10

## Context

O módulo de Email sincroniza caixas IMAP de múltiplas contas de usuário por tenant. Cada sincronização requer uma conexão TCP+TLS com o servidor de e-mail, que envolve:

- Handshake TCP (1-3 RTTs)
- Handshake TLS (2-4 RTTs adicionais em TLS 1.2; 1-2 RTTs em TLS 1.3)
- Autenticação IMAP (LOGIN ou OAUTH2)

Para uma conta com sync a cada 5 minutos em 50 tenants simultâneos, isso resulta em 10 conexões por minuto, cada uma com latência de 200-800ms dependendo do servidor de e-mail.

O padrão inicial era criar uma nova conexão `ImapFlow` por operação e fechar ao terminar. Os problemas observados:

- **Latência**: Cada operação de leitura de email pagava o custo completo de conexão.
- **Limites de conexão dos provedores**: Gmail e Outlook limitam conexões simultâneas por conta (tipicamente 15 IMAP). Muitas conexões de curta duração podem atingir o limite de rate.
- **Overhead de TLS**: Em servidores com certificados complexos, o handshake TLS sozinho levava 300-500ms.

Foram avaliadas as seguintes abordagens:

1. **Conexão por operação (abrir/fechar)**: Simples mas com latência alta por operação.
2. **Conexão persistente sem pool**: Uma conexão permanente por conta, mas sem controle de concorrência — operações simultâneas na mesma conta podem corromper o estado IMAP.
3. **Pool com uma conexão por conta e fila FIFO**: Uma conexão por conta; chamadas concorrentes aguardam em fila. Reúso da conexão com TTL de idle.

## Decision

Implementar `ImapConnectionPool` (`src/services/email/imap-connection-pool.ts`) com as seguintes características:

### Modelo: Uma Conexão por Conta

Cada conta de email (`accountId`) tem no máximo **uma conexão IMAP** no pool. Chamadas concorrentes para a mesma conta aguardam em uma fila FIFO em vez de abrir novas conexões.

```
acquire('acc-123') → conexão disponível? → retorna
                   → conexão em uso?     → entra na fila FIFO (max 30s)
                   → não existe?         → cria nova, armazena no pool
```

### Ciclo de Vida da Conexão

```
acquire(accountId)
  → reutiliza idle (verifica client.usable)
  → se morta: destroyEntry + cria nova
  → se em uso: waitForRelease (FIFO, timeout 30s)
  → se inexistente: doCreateAndStore

release(accountId)
  → se há fila: transfere conexão para próximo waiter
  → se não há fila: marca como idle, agenda idleTimer (60s)

[idleTimer expirado] → destroy(accountId) → client.logout()
```

### Circuit Breaker por Host

Para evitar hammering em servidores IMAP que estejam falhando, cada host:porta tem um `CircuitBreaker` (via `opossum`):

```typescript
const breakerKey = `imap:${config.host}:${config.port}`;
const breaker = createCircuitBreaker(
  (_acctId, cfg) => this.doCreateAndStore(_acctId, cfg),
  { name: breakerKey, type: 'external' },
);
```

Se um servidor IMAP falhar repetidamente, o circuit abre e todas as tentativas de conexão com aquele servidor falham imediatamente por `resetTimeout`, sem esperar o timeout TCP.

### TTLs e Timeouts

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `idleTtlMs` | 60.000ms | Tempo que uma conexão ociosa permanece no pool |
| `ACQUIRE_TIMEOUT_MS` | 30.000ms | Tempo máximo que um waiter aguarda na fila |

### Detecção de Conexão Morta

Antes de reutilizar uma conexão idle, o pool verifica `client.usable` (flag do `imapflow`). Conexões fechadas pelo servidor (evento `close`) são removidas automaticamente do pool.

### Singleton e Graceful Shutdown

```typescript
export function getImapConnectionPool(): ImapConnectionPool {
  if (!poolInstance) poolInstance = new ImapConnectionPool();
  return poolInstance;
}

// No shutdown do servidor:
await pool.destroyAll();
```

### Testabilidade

O pool expõe `resetImapConnectionPool()` para resetar o singleton entre testes. O `ImapConnectionPool` aceita `idleTtlMs` no construtor para acelerar testes (500ms no lugar de 60s).

### Cobertura de Testes

O arquivo `imap-connection-pool.spec.ts` cobre 9 cenários:
- Criação de nova conexão no primeiro acquire
- Reuso de conexão idle (verifica que `connect()` é chamado apenas uma vez)
- Conexões separadas para accounts distintas
- Fechamento após expiração do idle TTL
- Destruição explícita
- Destruição de todas as conexões (`destroyAll`)
- Enfileiramento de segundo caller enquanto conexão está em uso
- `release()` em account inexistente (sem throw)
- `destroy()` em account inexistente (sem throw)

## Consequences

**Positive:**
- Operações IMAP subsequentes na mesma conta evitam o custo de TCP+TLS, reduzindo latência de ~500ms para ~10ms.
- O circuit breaker por host previne cascata de erros quando um servidor de e-mail está indisponível.
- A fila FIFO garante que operações concorrentes na mesma conta sejam serializadas corretamente, evitando violações do protocolo IMAP (que é stateful por conexão).
- O idle TTL de 60s libera conexões de contas que não estão sendo usadas ativamente, respeitando os limites de conexão dos provedores.

**Negative:**
- Com uma única conexão por conta, operações longas (ex: sync completo de caixa grande) bloqueiam outras operações da mesma conta por até 30 segundos.
- O pool é in-process: em ambiente com múltiplos workers, cada processo terá seu próprio pool, podendo exceder os limites de conexão simultânea do provedor IMAP para contas com muito tráfego.
- A verificação `client.usable` detecta conexões mortas somente no momento do acquire. Uma conexão pode morrer silenciosamente enquanto está "em uso", resultando em erro na operação que a está usando (não no acquire).
- Não há limite máximo de conexões simultâneas no pool — em um sistema com muitas contas ativas ao mesmo tempo, o número total de conexões abertas pode crescer sem controle.
