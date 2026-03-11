# ADR-021: Tabela de sequência para códigos financeiros

## Status: Accepted

## Date: 2026-03-10

## Context

Lançamentos financeiros, empréstimos, consórcios e contratos precisam de códigos legíveis e sequenciais por tenant (ex: `FIN-000001`, `LOAN-000001`, `CTR-000001`). Esses códigos são exibidos em relatórios, boletos e comunicação com clientes.

Abordagens consideradas:

1. **UUID como código**: Ilegível para humanos, impraticável para referência verbal
2. **MAX(code) + 1**: Race condition sob concorrência — dois requests simultâneos geram o mesmo código
3. **Sequence do PostgreSQL**: Global, não suporta isolamento por tenant nativamente
4. **Tabela de sequência com lock**: Atômico, isolado por tenant, sem race conditions

## Decision

Usar uma tabela `FinanceCodeSequence` (mapeada para `finance_code_sequences`) com incremento atômico via `UPDATE ... SET last_value = last_value + 1 RETURNING last_value`:

```prisma
model FinanceCodeSequence {
  id        String @id @default(uuid())
  tenantId  String @map("tenant_id")
  prefix    String // "FIN", "LOAN", "CONS", "CTR"
  lastValue Int    @default(0) @map("last_value")

  @@unique([tenantId, prefix])
  @@map("finance_code_sequences")
}
```

Cada combinação `(tenantId, prefix)` mantém seu próprio contador. O código gerado segue o padrão `{PREFIX}-{lastValue.padStart(6, '0')}`.

A operação de incremento ocorre dentro da mesma transação da criação do registro, garantindo que o código só é consumido se o registro for persistido com sucesso.

## Consequences

**Positivo:**

- Códigos legíveis e sequenciais por tenant (FIN-000001, FIN-000002, ...)
- Sem race conditions: `UPDATE ... RETURNING` é atômico no PostgreSQL
- Isolamento por tenant: cada tenant tem sua própria sequência
- Prefixos distintos por tipo de entidade evitam confusão (FIN vs LOAN vs CTR)
- Rollback de transação não consome o número (se a transação falhar, o incremento é revertido)

**Negativo:**

- Lock de linha durante a transação pode ser bottleneck sob alta concorrência
- Gaps na sequência podem ocorrer se a transação falhar após o incremento mas antes do commit (raro com transação única)
- Requer seed/migration para criar registros iniciais por tenant
