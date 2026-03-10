# ADR-012: Domain Events Pattern

## Status: Accepted
## Date: 2026-03-10

## Context

O sistema OpenSea possui múltiplos módulos (HR, Finance, Stock, Calendar) que precisam reagir a ações ocorridas em outros módulos. Exemplos concretos:

- Quando uma ausência de funcionário é aprovada (HR), o módulo de Agenda (Calendar) precisa criar um evento de bloqueio de período.
- Quando uma entrada financeira é criada (Finance), o Calendar precisa criar um lembrete de vencimento.
- Quando uma ordem de compra é criada (Stock), o Calendar precisa registrar a data de entrega esperada.
- Quando um funcionário é criado ou atualizado com data de aniversário (HR), o Calendar precisa criar ou atualizar o evento recorrente anual.

A abordagem direta — um use case de HR importando e instanciando serviços do módulo Calendar — criaria acoplamento direto entre módulos, violando o princípio de isolamento de módulo e tornando os use cases difíceis de testar.

Foram avaliadas as seguintes abordagens:

1. **Chamada direta entre use cases** — Acoplamento forte, viola isolamento de módulo.
2. **BullMQ jobs para todos os eventos** — Overhead para eventos síncronos simples; requer serialização de payloads completos.
3. **Event bus in-process** — Desacoplamento via publicação/assinatura, sem necessidade de infraestrutura adicional para eventos síncronos.
4. **Webhooks internos via HTTP** — Latência desnecessária para comunicação intra-processo.

## Decision

Adotar um **Domain Event Bus in-process** implementado como singleton (`src/lib/domain-events.ts`).

### Estrutura de um Evento

```typescript
export interface DomainEvent<T = unknown> {
  type: string;       // ex: 'hr.absence.approved'
  tenantId: string;   // obrigatório — multi-tenancy
  userId: string;     // quem originou a ação
  payload: T;         // dados específicos do evento
  occurredAt: Date;   // timestamp de ocorrência
}
```

### Nomes de Eventos

Eventos seguem a convenção `{module}.{entity}.{action}` e são declarados como constantes em `DOMAIN_EVENTS`:

```typescript
export const DOMAIN_EVENTS = {
  HR_ABSENCE_APPROVED:       'hr.absence.approved',
  HR_ABSENCE_REQUESTED:      'hr.absence.requested',
  HR_EMPLOYEE_CREATED:       'hr.employee.created',
  HR_EMPLOYEE_UPDATED:       'hr.employee.updated',
  FINANCE_ENTRY_CREATED:     'finance.entry.created',
  FINANCE_PAYMENT_REGISTERED:'finance.payment.registered',
  STOCK_PO_CREATED:          'stock.purchase-order.created',
  STOCK_PO_CANCELLED:        'stock.purchase-order.cancelled',
} as const;
```

### Comportamento do Bus

- **Registro de handlers**: `domainEventBus.on(eventType, handler)` — múltiplos handlers para o mesmo tipo são suportados.
- **Emissão**: `domainEventBus.emit(event)` — todos os handlers registrados são executados concorrentemente via `Promise.allSettled`.
- **Fire-and-forget com log de falha**: Falhas de handlers são logadas mas **não propagadas** ao emissor. O use case primário não falha por causa de um side-effect.
- **Isolamento por tenant**: O `tenantId` é parte obrigatória do envelope — handlers multi-tenant isolam dados corretamente.

### Registro de Subscribers

Os subscribers são registrados uma única vez durante o startup do servidor, em `src/lib/domain-event-subscribers.ts`:

```typescript
export function registerDomainEventSubscribers(): void {
  const calendarSync = makeCalendarSyncService();

  domainEventBus.on(DOMAIN_EVENTS.HR_ABSENCE_APPROVED, async (event) => {
    await calendarSync.syncAbsence({ ...event.payload, tenantId: event.tenantId });
  });

  // ... demais subscribers
}
```

### Emissão em Use Cases

Use cases emitem eventos após completar sua operação primária:

```typescript
// src/use-cases/hr/absences/approve-absence.ts
await domainEventBus.emit({
  type: DOMAIN_EVENTS.HR_ABSENCE_APPROVED,
  tenantId: request.tenantId,
  userId: request.approvedBy,
  payload: { absenceId, absenceType, employeeName, startDate, endDate },
  occurredAt: new Date(),
});
```

### Testabilidade

O bus expõe `domainEventBus.clear()` para limpar todos os handlers entre testes, evitando vazamento de estado:

```typescript
beforeEach(() => {
  domainEventBus.clear();
});
```

### Escopo Atual de Eventos (Março 2026)

| Evento | Emissor | Subscriber | Efeito |
|--------|---------|-----------|--------|
| `hr.absence.approved` | ApproveAbsenceUseCase | CalendarSyncService | Cria/atualiza evento de ausência |
| `hr.absence.requested` | RequestAbsenceUseCase | CalendarSyncService | Registra pedido no calendário |
| `hr.employee.created` | CreateEmployeeUseCase | CalendarSyncService | Cria evento anual de aniversário |
| `hr.employee.updated` | UpdateEmployeeUseCase | CalendarSyncService | Atualiza evento de aniversário |
| `finance.entry.created` | CreateFinanceEntryUseCase | CalendarSyncService | Cria lembrete de vencimento |
| `stock.purchase-order.created` | CreatePurchaseOrderUseCase | CalendarSyncService | Cria evento de entrega esperada |

## Consequences

**Positive:**
- Use cases emissores não conhecem os use cases receptores — acoplamento zero entre módulos.
- Handlers podem ser adicionados sem modificar o use case emissor.
- Testes unitários dos use cases primários ignoram side-effects por completo.
- Falhas em side-effects (ex: Calendar indisponível) não afetam a operação principal.
- O padrão é extensível: adicionar novo subscriber significa uma linha em `domain-event-subscribers.ts`.

**Negative:**
- Eventos são in-process: se o servidor reiniciar entre a emissão e o processamento, o evento é perdido. Para garantias de entrega, use BullMQ (ADR-005).
- A ordem de execução dos handlers não é garantida (todos rodam em paralelo via `Promise.allSettled`).
- Falhas de handlers são silenciadas do ponto de vista do emissor, o que pode mascarar bugs de integração em produção se o monitoramento de logs não estiver ativo.
- O bus é um singleton global — em ambientes com múltiplos workers (cluster mode), cada processo tem seu próprio bus.
