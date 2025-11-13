# Stock - Item Movements (Movimentações de Itens)

Histórico de movimentações de itens no estoque.

## GET /v1/item-movements
Listar movimentações de itens.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Query Params
```typescript
{
  itemId?: string;           // Filtrar por item
  userId?: string;           // Filtrar por usuário
  movementType?: string;     // "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT"
  salesOrderId?: string;     // Filtrar por pedido de venda
  batchNumber?: string;      // Filtrar por lote
  pendingApproval?: boolean; // Filtrar pendentes de aprovação
}
```

### Response 200
```typescript
{
  movements: Array<{
    id: string;
    itemId: string;
    userId: string;
    quantity: number;
    quantityBefore?: number | null;
    quantityAfter?: number | null;
    movementType: "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
    reasonCode?: string | null;
    destinationRef?: string | null;
    batchNumber?: string | null;
    notes?: string | null;
    approvedBy?: string | null;
    salesOrderId?: string | null;
    createdAt: Date;
  }>;
}
```

---

## Exemplo de Uso

```typescript
// Listar todas as movimentações
const movements = await fetch('http://localhost:3333/v1/item-movements', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Filtrar movimentações de um item específico
const itemMovements = await fetch(
  `http://localhost:3333/v1/item-movements?itemId=${itemId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// Filtrar movimentações de saída
const exits = await fetch(
  'http://localhost:3333/v1/item-movements?movementType=EXIT',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());
```
