# ADR-020: Rateio por percentual em centros de custo

## Status: Accepted

## Date: 2026-03-10

## Context

Lançamentos financeiros frequentemente precisam ser alocados a múltiplos centros de custo. Exemplos:

- Aluguel do escritório rateado 60% administrativo / 40% comercial
- Conta de energia rateada entre 3 departamentos

Duas abordagens foram consideradas:

1. **Rateio por valor fixo**: cada alocação especifica um valor em reais
2. **Rateio por percentual**: cada alocação especifica um percentual do total

## Decision

Adotar rateio por percentual com validação de soma 100%. A alocação é feita via `costCenterAllocations` no schema de criação de lançamento:

```typescript
costCenterAllocations: z.array(
  z.object({
    costCenterId: z.string().uuid(),
    percentage: z.number().min(0.01).max(100),
  }),
);
```

Regras de negócio no `CreateFinanceEntryUseCase`:

- A soma dos percentuais deve ser exatamente 100%
- O valor de cada alocação é calculado: `(expectedAmount * percentage) / 100`
- Se informado `costCenterId` simples (sem array), o lançamento vai 100% para aquele centro
- `costCenterAllocations` e `costCenterId` são mutuamente exclusivos

Os valores calculados são persistidos na tabela `finance_entry_cost_centers` junto com o percentual original, permitindo rastreabilidade do rateio.

## Consequences

**Positivo:**

- Percentuais são estáveis quando o valor do lançamento muda (basta recalcular)
- Modelo mental simples para o usuário: "60% administrativo, 40% comercial"
- Validação clara: soma deve ser 100%
- Relatórios de DRE e balanço podem agrupar por centro de custo com precisão

**Negativo:**

- Arredondamento pode gerar diferenças de centavos (ex: R$ 100,00 / 3 = R$ 33,33 + R$ 33,33 + R$ 33,34)
- Atualização do `expectedAmount` requer recálculo das alocações
- Centros de custo hierárquicos (com `parentId`) não agregam automaticamente os percentuais dos filhos
