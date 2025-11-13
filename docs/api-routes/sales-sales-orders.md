# Sales - Sales Orders (Pedidos de Venda)

Rotas para gerenciar pedidos de venda.

## GET /v1/sales-orders
Listar pedidos de venda.

**Permissões:** Autenticado

### Query Params
```typescript
{
  page?: number;           // Padrão: 1
  limit?: number;          // Padrão: 20, máx: 100
  search?: string;         // Busca textual
  status?: string;         // Filtrar por status
  startDate?: Date;        // Data inicial
  endDate?: Date;          // Data final
  sortBy?: string;         // Campo para ordenação
  sortOrder?: "asc" | "desc";  // Padrão: "desc"
}
```

### Response 200
```typescript
{
  salesOrders: Array<{
    id: string;
    orderNumber: string;
    customerId: string;
    createdBy?: string | null;
    status: "DRAFT" | "PENDING" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "RETURNED";
    totalPrice: number;
    discount: number;
    finalPrice: number;
    notes?: string | null;
    items: Array<{
      id: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      totalPrice: number;
      notes?: string | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }>;
}
```

---

## GET /v1/sales-orders/:id
Obter pedido por ID.

**Permissões:** Autenticado

### Params
- `id` (string, UUID)

### Response 200
```typescript
{
  salesOrder: object;
}
```

---

## POST /v1/sales-orders
Criar novo pedido de venda.

**Permissões:** Autenticado

### Request Body
```typescript
{
  customerId: string;                  // UUID
  orderNumber: string;                 // 1-100 caracteres
  status?: "DRAFT" | "PENDING" | "CONFIRMED";  // Padrão: "PENDING"
  discount?: number;                   // Desconto (>= 0), padrão: 0
  notes?: string;                      // Máx 1000 caracteres
  items: Array<{
    variantId: string;                 // UUID
    quantity: number;                  // Inteiro positivo
    unitPrice: number;                 // Preço unitário positivo
    discount?: number;                 // Desconto (>= 0), padrão: 0
    notes?: string;                    // Máx 1000 caracteres
  }>;                                  // Mínimo 1 item
  createdBy?: string;                  // UUID do usuário (opcional)
}
```

### Response 201
```typescript
{
  salesOrder: object;
}
```

---

## PATCH /v1/sales-orders/:id/status
Atualizar status do pedido.

**Permissões:** Autenticado

### Params
- `id` (string, UUID)

### Request Body
```typescript
{
  status: "DRAFT" | "PENDING" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "RETURNED";
}
```

### Response 200
```typescript
{
  salesOrder: object;
}
```

---

## POST /v1/sales-orders/:id/cancel
Cancelar pedido.

**Permissões:** Autenticado

### Params
- `id` (string, UUID)

### Response 200
```typescript
{
  salesOrder: object;
}
```

---

## Exemplo de Uso

```typescript
// Criar pedido de venda
const order = await fetch('http://localhost:3333/v1/sales-orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerId: 'customer-uuid',
    orderNumber: 'ORD-2025-001',
    status: 'PENDING',
    discount: 10.00,
    notes: 'Cliente VIP - entrega prioritária',
    items: [
      {
        variantId: 'variant-uuid-1',
        quantity: 2,
        unitPrice: 99.90,
        discount: 0
      },
      {
        variantId: 'variant-uuid-2',
        quantity: 1,
        unitPrice: 149.90,
        discount: 5.00,
        notes: 'Presente - embalar com papel especial'
      }
    ]
  })
}).then(r => r.json());

// Atualizar status para confirmado
await fetch(`http://localhost:3333/v1/sales-orders/${order.salesOrder.id}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'CONFIRMED'
  })
});

// Listar pedidos com filtros
const orders = await fetch(
  'http://localhost:3333/v1/sales-orders?status=PENDING&limit=10',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());
```
