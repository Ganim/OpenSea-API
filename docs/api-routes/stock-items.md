# Stock - Items (Itens Físicos em Estoque)

Rotas para gerenciar itens físicos em estoque.

## GET /v1/items
Listar todos os itens.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Response 200
```typescript
{
  items: Array<{
    id: string;
    variantId: string;
    locationId: string;
    uniqueCode: string;
    initialQuantity: number;
    currentQuantity: number;
    status: "AVAILABLE" | "RESERVED" | "SOLD" | "DAMAGED";
    entryDate: Date;
    attributes: Record<string, unknown>;
    batchNumber?: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }>;
}
```

---

## GET /v1/items/:itemId
Obter item por ID.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Params
- `itemId` (string, UUID)

### Response 200
```typescript
{
  item: object;
}
```

---

## POST /v1/items/entry
Registrar entrada de item no estoque.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Request Body
```typescript
{
  uniqueCode: string;              // 1-128 caracteres, único
  variantId: string;               // UUID
  locationId: string;              // UUID
  quantity: number;                // Quantidade positiva
  attributes?: Record<string, unknown>;
  batchNumber?: string;            // Máx 100 caracteres
  manufacturingDate?: Date;
  expiryDate?: Date;
  notes?: string;                  // Máx 1000 caracteres
}
```

### Response 201
```typescript
{
  item: object;
  movement: {
    id: string;
    itemId: string;
    userId: string;
    quantity: number;
    movementType: string;
    createdAt: Date;
  };
}
```

---

## POST /v1/items/exit
Registrar saída de item do estoque.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Request Body
```typescript
{
  itemId: string;                  // UUID
  quantity: number;                // Quantidade positiva
  movementType: "SALE" | "PRODUCTION" | "SAMPLE" | "LOSS";
  reasonCode?: string;             // Máx 50 caracteres
  destinationRef?: string;         // Máx 255 caracteres
  notes?: string;                  // Máx 1000 caracteres
}
```

### Response 201
```typescript
{
  item: object;
  movement: object;
}
```

---

## POST /v1/items/transfer
Transferir item entre locais.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Request Body
```typescript
{
  itemId: string;                  // UUID
  destinationLocationId: string;   // UUID
  reasonCode?: string;             // Máx 50 caracteres
  notes?: string;                  // Máx 1000 caracteres
}
```

### Response 200
```typescript
{
  item: object;
  movement: object;
}
```

---

## Exemplo de Uso

```typescript
// Registrar entrada
const entry = await fetch('http://localhost:3333/v1/items/entry', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    uniqueCode: 'ITEM-001',
    variantId: 'variant-uuid',
    locationId: 'location-uuid',
    quantity: 100,
    batchNumber: 'BATCH-2025-001',
    manufacturingDate: '2025-01-01',
    expiryDate: '2026-01-01',
    notes: 'Recebimento do fornecedor X'
  })
}).then(r => r.json());

// Registrar saída (venda)
const exit = await fetch('http://localhost:3333/v1/items/exit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    itemId: 'item-uuid',
    quantity: 5,
    movementType: 'SALE',
    destinationRef: 'ORDER-123',
    notes: 'Venda para cliente X'
  })
}).then(r => r.json());

// Transferir item
const transfer = await fetch('http://localhost:3333/v1/items/transfer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    itemId: 'item-uuid',
    destinationLocationId: 'new-location-uuid',
    reasonCode: 'REORG',
    notes: 'Reorganização de estoque'
  })
}).then(r => r.json());
```
