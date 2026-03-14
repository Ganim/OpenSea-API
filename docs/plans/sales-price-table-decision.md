# Decisão Arquitetural: Tabela de Preços — Módulo de Vendas

**Data:** 2026-03-10
**Status:** Pendente (próximo projeto)

## Contexto

O campo `price` (preço de venda) e `profitMargin` (margem de lucro) atualmente residem no modelo `Variant` do módulo de estoque. No entanto, precificação é responsabilidade do módulo de vendas, não do estoque. O estoque lida apenas com `costPrice` (preço de custo), que vem da nota fiscal de entrada.

## Decisão

Migrar preço de venda, preço de atacado e condições comerciais para uma entidade **Tabela de Preços** no módulo de vendas.

## O que deve ser implementado

### Modelos

1. **`PriceTable`** — Tabela de preços do tenant
   - `id`, `tenantId`, `name` (ex: "Tabela Padrão", "Atacado Sul")
   - `isDefault` (boolean) — tabela padrão do tenant
   - `isActive` (boolean)
   - `createdAt`, `updatedAt`

2. **`PriceTableEntry`** — Entrada de preço por variante
   - `id`, `priceTableId`, `variantId`, `tenantId`
   - `retailPrice` (preço de varejo)
   - `wholesalePrice` (preço de atacado)
   - `wholesaleMinQuantity` (quantidade mínima de itens da variante para ativar atacado)
   - `profitMargin` (margem %)
   - `createdAt`, `updatedAt`
   - `@@unique([priceTableId, variantId])` — uma variante aparece no máximo 1x por tabela
   - `@@index([priceTableId])`, `@@index([variantId])`, `@@index([tenantId])`

### Migração

1. Criar modelos `PriceTable` e `PriceTableEntry`
2. Para cada tenant, criar uma `PriceTable` default (`isDefault: true`)
3. Migrar `price` e `profitMargin` de cada Variant para `PriceTableEntry` na tabela default
   - Variantes com `price = 0` (default do Prisma) recebem entrada com `retailPrice = 0` — não são ignoradas, pois o campo pode ter sido intencionalmente zerado
4. Remover `price` e `profitMargin` do modelo `Variant` (manter apenas `costPrice`)

### Funcionalidades

- CRUD de tabelas de preço
- Associar variantes a tabelas de preço
- UI de gerenciamento no módulo de vendas
- Integração com fluxo de pedidos de venda
- Um tenant pode ter múltiplas tabelas (varejo, atacado, regional, etc.)

### Permissões

- `sales.price-tables.create`
- `sales.price-tables.read`
- `sales.price-tables.update`
- `sales.price-tables.delete`
