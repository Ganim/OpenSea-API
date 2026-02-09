# Testes E2E Falhando (Pre-existentes)

**Data**: 2026-02-09
**Total**: 36 testes falhando em 35 arquivos (de 441 testes / 339 arquivos)
**Nota**: Todas as falhas sao pre-existentes, nenhuma relacionada ao modulo Finance.

---

## Grupo 1: RBAC 403 - Permissoes faltando nos testes

**Causa raiz**: Os testes e2e criam usuario com permissoes insuficientes. Os controllers exigem permissoes RBAC que nao estao sendo concedidas no setup do teste.

**Erro**: `expected 403 to be 200` (ou 201/204)

### Stock - Variants (6 testes)
| Arquivo | Teste | Erro |
|---------|-------|------|
| `stock/variants/v1-create-variant.e2e.spec.ts` | should create variant with correct schema | 403 != 201 |
| `stock/variants/v1-delete-variant.e2e.spec.ts` | should delete variant with correct schema | 403 != 204 |
| `stock/variants/v1-get-variant-by-id.e2e.spec.ts` | should get variant by id with correct schema | 403 != 200 |
| `stock/variants/v1-list-variants-by-product-id.e2e.spec.ts` | should list variants by product id with correct schema | 403 != 200 |
| `stock/variants/v1-list-variants.e2e.spec.ts` | should list variants with correct schema | 403 != 200 |
| `stock/variants/v1-update-variant.e2e.spec.ts` | should update variant with correct schema | 403 != 200 |

### Stock - Items (7 testes)
| Arquivo | Teste | Erro |
|---------|-------|------|
| `stock/items/v1-get-item-by-id.e2e.spec.ts` | should get item by id with correct schema | 403 != 200 |
| `stock/items/v1-list-items.e2e.spec.ts` | should list items with correct schema | 403 != 200 |
| `stock/items/v1-list-items-by-product-id.e2e.spec.ts` | should list items by product id with correct schema | 403 != 200 |
| `stock/items/v1-list-items-by-variant-id.e2e.spec.ts` | should list items by variant id with correct schema | 403 != 200 |
| `stock/items/v1-register-item-entry.e2e.spec.ts` | should register item entry with correct schema | 403 != 201 |
| `stock/items/v1-register-item-entry.e2e.spec.ts` | should persist unitCost when provided in item entry | 403 != 201 |
| `stock/items/v1-register-item-exit.e2e.spec.ts` | should register item exit with correct schema | 403 != 200 |
| `stock/items/v1-transfer-item.e2e.spec.ts` | should transfer item with correct schema | 403 != 200 |

### Stock - Labels (3 testes)
| Arquivo | Teste | Erro |
|---------|-------|------|
| `stock/labels/v1-generate-labels.e2e.spec.ts` | should generate labels with correct schema | 403 != 200 |
| `stock/labels/v1-generate-labels-by-zone.e2e.spec.ts` | should generate labels by zone with correct schema | 403 != 200 |
| `stock/labels/v1-get-label-preview.e2e.spec.ts` | should get label preview with correct schema | 403 != 200 |

### Stock - Purchase Orders (4 testes)
| Arquivo | Teste | Erro |
|---------|-------|------|
| `stock/purchase-orders/v1-create-purchase-order.e2e.spec.ts` | should create purchase order with correct schema | 403 != 201 |
| `stock/purchase-orders/v1-cancel-purchase-order.e2e.spec.ts` | should cancel purchase order with correct schema | 403 != 200 |
| `stock/purchase-orders/v1-get-purchase-order-by-id.e2e.spec.ts` | should get purchase order by id with correct schema | 403 != 200 |
| `stock/purchase-orders/v1-list-purchase-orders.e2e.spec.ts` | should list purchase orders with correct schema | 403 != 200 |

### Stock - Care (2 testes)
| Arquivo | Teste | Erro |
|---------|-------|------|
| `stock/care/v1-list-care-options.e2e.spec.ts` | should list care options with correct schema | 403 != 200 |
| `stock/care/v1-set-product-care.e2e.spec.ts` | should set product care instructions with correct schema | 403 != 200 |

### Stock - Item Movements (1 teste)
| Arquivo | Teste | Erro |
|---------|-------|------|
| `stock/item-movements/v1-list-item-movements.e2e.spec.ts` | should list item movements with correct schema | 403 != 200 |

**Solucao provavel**: Atualizar a factory `createAndAuthenticateE2E` ou cada teste para conceder as permissoes RBAC necessarias (ex: `stock.variants.create`, `stock.items.read.all`, etc.).

---

## Grupo 2: Volumes - Tenant nao selecionado (9 testes)

**Causa raiz**: A factory `create-volume.e2e.ts` falha ao criar volume porque o token nao tem `tenantId`. O `createVolumeE2E` usa um token que nao passou pelo `select-tenant`.

**Erro**: `Failed to create volume: No tenant selected. Please select a tenant first via POST /v1/auth/select-tenant`

| Arquivo | Teste |
|---------|-------|
| `stock/volumes/v1-add-item-to-volume.e2e.spec.ts` | should add an item to a volume |
| `stock/volumes/v1-close-volume.e2e.spec.ts` | should close a volume successfully |
| `stock/volumes/v1-delete-volume.e2e.spec.ts` | should delete a volume successfully (soft delete) |
| `stock/volumes/v1-deliver-volume.e2e.spec.ts` | should mark a closed volume as delivered |
| `stock/volumes/v1-get-romaneio.e2e.spec.ts` | should get romaneio for a volume |
| `stock/volumes/v1-get-volume-by-id.e2e.spec.ts` | should get a volume by ID |
| `stock/volumes/v1-remove-item-from-volume.e2e.spec.ts` | should remove an item from a volume |
| `stock/volumes/v1-reopen-volume.e2e.spec.ts` | should reopen a closed volume successfully |
| `stock/volumes/v1-return-volume.e2e.spec.ts` | should mark a delivered volume as returned |
| `stock/volumes/v1-update-volume.e2e.spec.ts` | should update a volume successfully |

**Solucao provavel**: Corrigir `src/utils/tests/factories/stock/create-volume.e2e.ts` para usar token tenant-scoped (via `select-tenant`).

---

## Grupo 3: Resposta com schema diferente do esperado (1 teste)

**Causa raiz**: O endpoint retorna `{ users: [...] }` mas o teste espera `{ tenantUsers: [...] }`.

**Erro**: `expected { users: [ { ...(8) } ] } to have property "tenantUsers"`

| Arquivo | Teste |
|---------|-------|
| `admin/v1-list-tenant-users.e2e.spec.ts` | should list users of a tenant |

**Solucao provavel**: Alinhar o nome da propriedade entre controller e teste. Verificar se o controller retorna `users` ou `tenantUsers` e atualizar o teste.

---

## Grupo 4: Health Check (1 teste)

**Causa raiz**: Provavelmente falha de conexao com Redis (ETIMEDOUT) afetando o health check detalhado.

| Arquivo | Teste |
|---------|-------|
| `health/health-check.e2e.spec.ts` | should return detailed health check |

**Solucao provavel**: Verificar se o Redis esta rodando ou se o health check precisa tratar timeout de Redis graciosamente.
