# ADR-022: Transações para operações multi-write no módulo financeiro

## Status: Accepted

## Date: 2026-03-10

## Context

O módulo financeiro possui diversas operações que envolvem múltiplas escritas interdependentes:

1. **Criar lançamento com parcelas**: cria o lançamento pai + N lançamentos filhos (parcelas) + alocações de centro de custo + incremento de sequência de código
2. **Criar empréstimo**: cria o header do empréstimo + tabela de amortização (N parcelas) + incremento de sequência
3. **Registrar pagamento**: atualiza o lançamento (status, valor pago) + cria registro de pagamento + atualiza saldo do empréstimo/consórcio
4. **Criar consórcio**: header + parcelas mensais + sequência

Sem transações, uma falha no meio do processo deixaria dados inconsistentes: um empréstimo sem parcelas, parcelas sem lançamento pai, ou códigos sequenciais consumidos sem registro correspondente.

## Decision

Todas as operações multi-write no módulo financeiro usam o `TransactionManager` (ver ADR-011) para garantir atomicidade. Os use cases recebem `TransactionManager` via injeção de construtor e envolvem todas as escritas em `transactionManager.run()`.

### Use cases com transação obrigatória

| Use Case                           | Escritas envolvidas                                         |
| ---------------------------------- | ----------------------------------------------------------- |
| `CreateFinanceEntryUseCase`        | Sequência + lançamento + N parcelas + alocações de CC       |
| `CreateLoanUseCase`                | Sequência + empréstimo + N parcelas de amortização          |
| `CreateConsortiumUseCase`          | Sequência + consórcio + N parcelas mensais                  |
| `CreateContractUseCase`            | Sequência + contrato                                        |
| `RegisterLoanPaymentUseCase`       | Pagamento + atualiza parcela + atualiza saldo do empréstimo |
| `RegisterConsortiumPaymentUseCase` | Pagamento + atualiza parcela + atualiza saldo               |

### Padrão de implementação

```typescript
async execute(request: Request): Promise<Response> {
  return this.transactionManager.run(async (tx) => {
    const code = await this.sequenceRepo.nextCode(tenantId, 'FIN', tx);
    const entry = await this.entriesRepo.create({ ...data, code }, tx);
    for (const installment of installments) {
      await this.entriesRepo.create({ ...installment, parentEntryId: entry.id }, tx);
    }
    return { entry };
  });
}
```

Repositórios participantes aceitam `tx?: TransactionClient` como último parâmetro, usando `const client = tx ?? prisma` internamente.

## Consequences

**Positivo:**

- Atomicidade garantida: todas as escritas sucedem ou falham juntas
- Códigos sequenciais nunca são consumidos sem registro correspondente
- Empréstimos e consórcios sempre têm suas parcelas completas
- Pagamentos parciais não deixam saldos inconsistentes

**Negativo:**

- Transações longas (ex: empréstimo com 360 parcelas) mantêm lock no banco por mais tempo
- Timeout de 30 segundos (configurado no `PrismaTransactionManager`) pode ser insuficiente para operações com muitas parcelas
- Todos os repositórios envolvidos precisam suportar o parâmetro `tx`, aumentando a superfície de manutenção
