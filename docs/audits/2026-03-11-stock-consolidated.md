# Auditoria Consolidada - Modulo Stock

**Data:** 2026-03-11
**Escopo:** OpenSea-API + OpenSea-APP, modulo `stock` completo
**Auditor:** Claude Opus 4.6
**Metodologia:** 12 dimensoes auditadas por agentes especializados em 2026-03-10/11

---

## 1. Scorecard Consolidado

| # | Dimensao | Nota | Veredicto |
|---|----------|------|-----------|
| 1 | Security | **9.2** | Excelente |
| 2 | Standards | **8.5** | Bom |
| 3 | Governance | **8.0** | Bom |
| 4 | Design System | **8.0** | Bom |
| 5 | API Contract | **7.5** | Atencao |
| 6 | Performance | **6.5** | Critico |
| 7 | Testing | **6.5** | Critico |
| 8 | Business Rules | **5.6** | Critico |
| 9 | Data Integrity | **5.6** | Critico |
| 10 | Responsiveness | **5.4** | Critico |
| 11 | UI/UX | **7.8** | Atencao |
| 12 | Accessibility | **6.1** | Critico |

**Media Final (12 dims): 7.06 / 10.0**
**Meta: 9.0 / 10.0**

---

## 2. Top 20 Issues por Impacto no Score

Cada item resolvido eleva a nota da dimensao correspondente. Itens ordenados por impacto ponderado (severidade x ganho de pontos).

| # | Issue | Dimensao(oes) | Sev. | Ganho Est. |
|---|-------|---------------|------|------------|
| 1 | Transacoes ausentes em 6 use cases (entry/exit/transfer/zone/delete) | Data Integrity | CRIT | +2.0 |
| 2 | Paginacao ausente em 11 endpoints (items, products, variants, movements) | Performance | CRIT | +2.0 |
| 3 | Testes multi-tenant ausentes (17 subdominios) | Testing | CRIT | +1.5 |
| 4 | Testes E2E ausentes para 9 controllers (attachments + care) | Testing | CRIT | +1.0 |
| 5 | Grids fixos sem breakpoints em formularios (edit product, locations) | Responsiveness | CRIT | +1.5 |
| 6 | Audit logging ausente em todas as acoes de estoque | Business Rules | ALTO | +1.5 |
| 7 | Inventario ciclico nao implementado (StockSnapshot sem use cases) | Business Rules | CRIT | +1.0 |
| 8 | Race conditions em sequentialCode (variant/item read-then-write) | Data Integrity | ALTO | +1.0 |
| 9 | Tabelas sem layout mobile alternativo (overview, movements) | Responsiveness | ALTO | +1.0 |
| 10 | Relatorios/exportacoes completamente ausentes (6 permissoes definidas) | Business Rules | MEDIO | +1.0 |
| 11 | Tipos frontend desincronizados com Zod backend (~15 campos) | API Contract | CRIT | +1.0 |
| 12 | Cache Redis ausente para templates/categorias/fabricantes | Performance | MEDIO | +1.0 |
| 13 | Hooks legados sem staleTime (useProducts, useItems, useVariants) | Performance | MEDIO | +0.5 |
| 14 | N+1 em detachItemsFromBins (N updates individuais) | Performance | ALTO | +0.5 |
| 15 | text-gray-*/text-slate-* em vez de tokens semanticos (~30 ocorrencias) | Design System | MEDIO | +0.5 |
| 16 | Padding fixo px-6 no layout principal (overflow em 320px) | Responsiveness | CRIT | +0.5 |
| 17 | Middleware de permissao ausente em 2 controllers de purchase-orders | Standards | ALTO | +0.5 |
| 18 | Maquinas de estado sem guardas de transicao (Product/Item status) | Business Rules | ALTO | +0.5 |
| 19 | Soft-delete de produto nao propaga para variantes filhas | Data Integrity | ALTO | +0.5 |
| 20 | Rate limiting por rota ausente em 12 sub-modulos de rotas | Security | ALTO | +0.4 |

---

## 3. Roadmap de Correcoes para Nota 9.0

### Fase 1: Integridade & Seguranca (Semana 1-2)
**Impacto: Data Integrity 5.6→8.5, Standards 8.5→9.5**

| # | Item | Dim. | Esforco |
|---|------|------|---------|
| 1.1 | Transacoes em RegisterItemEntry/Exit/Transfer (injetar TransactionManager) | DI | 1d |
| 1.2 | Transacao em ConfigureZoneStructure (7 ops atomicas) | DI | 0.5d |
| 1.3 | Transacao em DeleteZone (4 ops atomicas) | DI | 0.5d |
| 1.4 | Transacao em ReorderCategories (N updates atomicos) | DI | 0.5d |
| 1.5 | BatchTransferItems: transactionManager obrigatorio (remover `?`) | DI | 0.25d |
| 1.6 | Soft-delete cascata logica: DeleteProduct → soft-delete variantes | DI | 0.5d |
| 1.7 | Race condition: retry com backoff em violacao de unique (variant/item seq) | DI | 1d |
| 1.8 | Middleware verifyPermission em v1-list/get-purchase-orders controllers | STD | 0.25d |
| 1.9 | Imports relativos → @/ em 3 controllers de purchase-orders | STD | 0.25d |
| 1.10 | Rate limiting por rota nos 12 sub-modulos restantes (copiar padrao products) | SEC | 0.5d |

**Subtotal: ~5.25 dias**

### Fase 2: Performance Backend (Semana 2-3)
**Impacto: Performance 6.5→8.5**

| # | Item | Dim. | Esforco |
|---|------|------|---------|
| 2.1 | Paginacao em findAllWithRelations (items) — skip/take + meta | PERF | 1d |
| 2.2 | Paginacao em findMany (products) — todos os filtros (status, template, etc.) | PERF | 1d |
| 2.3 | Paginacao em findMany (variants) | PERF | 0.5d |
| 2.4 | Paginacao em findAll/findManyBy* (item-movements) | PERF | 0.5d |
| 2.5 | Depreciar hooks legados (useProducts/Items/Variants) → migrar para paginados | PERF | 1d |
| 2.6 | Corrigir N+1 em detachItemsFromBins (updateMany batch) | PERF | 0.5d |
| 2.7 | Cache Redis para templates (TTL 15min, invalidar em update) | PERF | 0.5d |
| 2.8 | Cache Redis para categorias e fabricantes (TTL 10min) | PERF | 0.5d |
| 2.9 | staleTime: 30s nos hooks legados restantes + useItemMovements | PERF | 0.25d |
| 2.10 | Indice composto [tenantId, deletedAt] e [tenantId, productId, deletedAt] em Variant | PERF | 0.25d |

**Subtotal: ~6 dias**

### Fase 3: Testes (Semana 3-4)
**Impacto: Testing 6.5→8.5**

| # | Item | Dim. | Esforco |
|---|------|------|---------|
| 3.1 | E2E para product-attachments (3 controllers: create/delete/list) | TEST | 1d |
| 3.2 | E2E para product-care-instructions (3 controllers) | TEST | 1d |
| 3.3 | E2E para variant-attachments (3 controllers) | TEST | 1d |
| 3.4 | Testes multi-tenant (list-products, list-items, get-product-by-id, list-warehouses, list-zones, list-bins) | TEST | 2d |
| 3.5 | Expandir E2E com cenarios de erro (meta: 2+ testes/controller nos 10 mais criticos) | TEST | 2d |
| 3.6 | Factories E2E faltantes (warehouse, zone, bin, category, supplier, tag, template) | TEST | 1d |
| 3.7 | Corrigir InMemoryItemsRepository.findManyByProduct (retorna [] sempre) | TEST | 0.25d |

**Subtotal: ~8.25 dias**

### Fase 4: Responsividade, UI/UX & Acessibilidade (Semana 4-5)
**Impacto: Responsiveness 5.4→8.0, Design System 8.0→9.0, UI/UX 7.8→9.0, Accessibility 6.1→8.5**

| # | Item | Dim. | Esforco |
|---|------|------|---------|
| 4.1 | Layout principal: px-6 → px-3 sm:px-4 md:px-6 | RESP | 0.25d |
| 4.2 | Edit Product: grid-cols-3 → grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (3 instancias) | RESP | 0.5d |
| 4.3 | Edit Product switches: grid-cols-2 → grid-cols-1 sm:grid-cols-2 | RESP | 0.25d |
| 4.4 | Locations form: grid-cols-2 → grid-cols-1 sm:grid-cols-2 | RESP | 0.25d |
| 4.5 | Stock Overview tabela: sticky first column + scroll indicator mobile | RESP | 1d |
| 4.6 | Movements tabela: mesma correcao da 4.5 | RESP | 0.5d |
| 4.7 | PageActionBar: touch targets min-h-[44px] min-w-[44px] | RESP | 0.25d |
| 4.8 | Navbar: colapsar botoes secundarios em dropdown < sm | RESP | 1d |
| 4.9 | text-gray-*/text-slate-* → tokens semanticos (30 ocorrencias) | DS | 0.5d |
| 4.10 | warehouse-card skeleton: bg-gray-200 → bg-muted | DS | 0.1d |
| 4.11 | Imports dinamicos (next/dynamic) para modais pesados de stock | PERF/UX | 0.5d |
| 4.12 | **BUG**: Manufacturer detail "Excluir" faz router.push em vez de abrir modal | UX | 0.25d |
| 4.13 | Remover texto dev do delete-confirm-modal ("reversivel se houver soft delete") | UX | 0.1d |
| 4.14 | Corrigir "Sem descricao" → "Sem descricao" (acento) em categorias/tags | UX | 0.1d |
| 4.15 | Loading skeletons (loading.tsx) para 8 rotas de stock faltantes | UX | 1d |
| 4.16 | BinCell: adicionar role="button", tabIndex={0}, aria-label | A11Y | 0.5d |
| 4.17 | attachment-list.tsx: aria-label nos botoes de download/exclusao | A11Y | 0.25d |
| 4.18 | properties-panel.tsx: htmlFor/id nos 12+ pares Label/Input | A11Y | 0.5d |
| 4.19 | items-action-bar.tsx: aria-label nos 7 botoes de acao (substituir title) | A11Y | 0.25d |
| 4.20 | rename-product-modal.tsx: aria-label no botao X de fechar | A11Y | 0.1d |
| 4.21 | stock-alerts.tsx AlertItem: semantica de botao (role/tabIndex) | A11Y | 0.25d |

**Subtotal: ~6.65 dias**

### Fase 5: Business Rules Essenciais (Semana 5-7)
**Impacto: Business Rules 5.6→8.0**

| # | Item | Dim. | Esforco |
|---|------|------|---------|
| 5.1 | Audit logging: queueAuditLog em RegisterItemEntry/Exit/Transfer | BIZ | 1d |
| 5.2 | Audit logging: queueAuditLog em CancelPO, DeleteProduct, UpdateProduct (status) | BIZ | 0.5d |
| 5.3 | Guardas de transicao: ProductStatus.canTransitionTo() + validacao em metodos | BIZ | 0.5d |
| 5.4 | Guardas de transicao: ItemStatus.canTransitionTo() | BIZ | 0.5d |
| 5.5 | Workflow aprovacao: RegisterItemExit bloquear LOSS/INVENTORY_ADJUSTMENT sem aprovacao | BIZ | 1.5d |
| 5.6 | ReceivePurchaseOrder: conectar PO.receive() com RegisterItemEntry automatico | BIZ | 2d |
| 5.7 | Alerta estoque minimo: cron que verifica reorderPoint e gera notificacao | BIZ | 1d |
| 5.8 | RegisterItemExit: atualizar status quando currentQuantity = 0 | BIZ | 0.25d |

**Subtotal: ~7.25 dias**

### Fase 6: API Contract & Frontend Sync (Semana 7-8)
**Impacto: API Contract 7.5→9.0**

| # | Item | Dim. | Esforco |
|---|------|------|---------|
| 6.1 | Sincronizar tipos frontend com Zod backend (Product: ~8 campos) | API | 1d |
| 6.2 | Sincronizar tipos frontend com Zod backend (Variant, Item, Supplier) | API | 1d |
| 6.3 | Padronizar shape de paginacao no frontend (meta com total/page/limit/pages) | API | 0.5d |
| 6.4 | Padronizar idioma das mensagens de erro (tudo em ingles na API) | STD | 0.5d |
| 6.5 | Remover try/catch redundante nos controllers (error handler global ja cobre) | STD | 1d |
| 6.6 | Padronizar mapper de volume (mover para diretorio com arquivos separados) | STD | 0.25d |

**Subtotal: ~4.25 dias**

---

## 4. Projecao de Notas Pos-Roadmap

| Dimensao | Antes | Apos Roadmap | Delta |
|----------|-------|-------------|-------|
| Security | 9.2 | **9.6** | +0.4 |
| Standards | 8.5 | **9.5** | +1.0 |
| Governance | 8.0 | **8.5** | +0.5 |
| Design System | 8.0 | **9.0** | +1.0 |
| API Contract | 7.5 | **9.0** | +1.5 |
| Performance | 6.5 | **8.5** | +2.0 |
| Testing | 6.5 | **8.5** | +2.0 |
| Business Rules | 5.6 | **8.0** | +2.4 |
| Data Integrity | 5.6 | **8.5** | +2.9 |
| Responsiveness | 5.4 | **8.0** | +2.6 |
| UI/UX | 7.8 | **9.0** | +1.2 |
| Accessibility | 6.1 | **8.5** | +2.4 |

**Media Projetada: ~8.8 / 10.0** (vs 7.06 atual)

### Para atingir 9.0+ (Fase Extra)

Para ir de 8.8 para 9.0, seria necessario tambem implementar:

| Item | Dim. | Esforco |
|------|------|---------|
| Inventario ciclico (InventoryCycle + InventoryCount entities + 5 use cases + frontend) | BIZ | 5d |
| Custo medio ponderado no RegisterItemEntry | BIZ | 2d |
| Relatorio de posicao de estoque + exportacao CSV | BIZ | 3d |
| Testes Playwright para fluxos criticos de stock (frontend E2E) | TEST | 3d |
| tenantId nos metodos update/save/delete dos repositorios (defesa em profundidade) | DI | 2d |

**Subtotal extra: ~15 dias**
**Media Final Projetada: ~9.2 / 10.0**

---

## 5. Esforco Total Estimado

| Fase | Dias | Foco |
|------|------|------|
| Fase 1: Integridade & Seguranca | 5.25d | Backend |
| Fase 2: Performance Backend | 6d | Backend |
| Fase 3: Testes | 8.25d | Backend |
| Fase 4: Responsividade, UI/UX & A11y | 6.65d | Frontend |
| Fase 5: Business Rules | 7.25d | Backend |
| Fase 6: API Contract & Sync | 4.25d | Ambos |
| **Total (8.8)** | **~37.5 dias** | |
| Fase Extra (9.0+) | +15d | Ambos |
| **Total (9.2)** | **~52.5 dias** | |

---

## 6. Dependencias entre Fases

```
Fase 1 (Transacoes) ─┐
                      ├──> Fase 3 (Testes usam transacoes)
Fase 2 (Paginacao) ──┘
                      ├──> Fase 6 (Sync frontend com novos endpoints paginados)
Fase 4 (UI) ──────────┘

Fase 5 (Business Rules) - independente, pode ser paralelizada com Fases 1-4
```

**Ordem otima:** Fases 1+5 em paralelo → Fases 2+4 em paralelo → Fase 3 → Fase 6

---

## 7. Relatorios Fonte

| Dimensao | Arquivo |
|----------|---------|
| Security | `OpenSea-API/docs/audits/security/2026-03-10-stock.md` |
| Standards | `OpenSea-API/docs/audits/standards/2026-03-10-stock.md` |
| Governance | `OpenSea-API/docs/audits/governance/2026-03-10-stock.md` |
| Design System | `OpenSea-APP/docs/audits/design-system/2026-03-10-stock.md` |
| API Contract | `OpenSea-API/docs/audits/api-contract/2026-03-10-stock.md` |
| Performance | `OpenSea-API/docs/audits/performance/2026-03-10-stock.md` |
| Testing | `OpenSea-API/docs/audits/testing/2026-03-10-stock.md` |
| Business Rules | `OpenSea-API/docs/audits/business-rules/2026-03-10-stock.md` |
| Data Integrity | `OpenSea-API/docs/audits/data-integrity/2026-03-10-stock.md` |
| Responsiveness | `OpenSea-APP/docs/audits/responsiveness/2026-03-10-stock.md` |
| UI/UX | `OpenSea-APP/docs/audits/ui-ux/2026-03-10-stock.md` |
| Accessibility | `OpenSea-APP/docs/audits/accessibility/2026-03-10-stock.md` |
