# Sales - Comments, Promotions, Reservations, Notifications

Rotas para comentários, promoções de variantes, reservas de itens e preferências de notificação.

## Comments (Comentários)

### Rotas Disponíveis
- `GET /v1/comments` - Listar comentários
- `GET /v1/comments/:id` - Obter comentário por ID
- `POST /v1/comments` - Criar comentário (Autenticado)
- `PATCH /v1/comments/:id` - Atualizar comentário (Autenticado)
- `DELETE /v1/comments/:id` - Excluir comentário (soft delete, Autenticado)

### Criar Comentário
```typescript
{
  entityType: string;        // 1-50 caracteres (ex: "product", "order")
  entityId: string;          // UUID da entidade comentada
  content: string;           // 1-2000 caracteres
  parentCommentId?: string;  // UUID (para respostas)
}
```

### Response
```typescript
{
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
```

---

## Variant Promotions (Promoções de Variantes)

### Rotas Disponíveis
- `GET /v1/variant-promotions` - Listar promoções
- `GET /v1/variant-promotions/:id` - Obter promoção por ID
- `POST /v1/variant-promotions` - Criar promoção (Autenticado)
- `PATCH /v1/variant-promotions/:id` - Atualizar promoção (Autenticado)
- `DELETE /v1/variant-promotions/:id` - Excluir promoção (soft delete, Autenticado)

### Criar Promoção
```typescript
{
  variantId: string;                        // UUID
  name: string;                             // 1-255 caracteres
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;                    // Valor positivo
  startDate: Date;                          // Data de início
  endDate: Date;                            // Data de término
  isActive?: boolean;                       // Padrão: true
  notes?: string;                           // Máx 1000 caracteres
}
```

### Response
```typescript
{
  id: string;
  variantId: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrentlyValid: boolean;    // Se está válida agora
  isExpired: boolean;           // Se já expirou
  isUpcoming: boolean;          // Se ainda não começou
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

### Exemplo
```typescript
// Criar promoção de 20% de desconto
const promotion = await fetch('http://localhost:3333/v1/variant-promotions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    variantId: 'variant-uuid',
    name: 'Black Friday 2025',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    startDate: '2025-11-25T00:00:00Z',
    endDate: '2025-11-30T23:59:59Z',
    isActive: true
  })
}).then(r => r.json());
```

---

## Item Reservations (Reservas de Itens)

### Rotas Disponíveis
- `GET /v1/item-reservations` - Listar reservas
- `GET /v1/item-reservations/:id` - Obter reserva por ID
- `POST /v1/item-reservations` - Criar reserva (Autenticado)
- `POST /v1/item-reservations/:id/release` - Liberar reserva (Autenticado)

### Criar Reserva
```typescript
{
  itemId: string;          // UUID
  userId: string;          // UUID
  quantity: number;        // Inteiro positivo
  reason?: string;         // Máx 500 caracteres
  reference?: string;      // Máx 255 caracteres (ex: número do pedido)
  expiresAt: Date;         // Data de expiração
}
```

### Response
```typescript
{
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
  releasedAt?: Date;
  isExpired: boolean;      // Se já expirou
  isReleased: boolean;     // Se já foi liberada
  isActive: boolean;       // Se está ativa
  createdAt: Date;
}
```

### Exemplo
```typescript
// Criar reserva para pedido
const reservation = await fetch('http://localhost:3333/v1/item-reservations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    itemId: 'item-uuid',
    userId: 'user-uuid',
    quantity: 5,
    reason: 'Pedido aguardando pagamento',
    reference: 'ORDER-123',
    expiresAt: '2025-11-15T23:59:59Z'
  })
}).then(r => r.json());

// Liberar reserva
await fetch(`http://localhost:3333/v1/item-reservations/${reservation.id}/release`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Notification Preferences (Preferências de Notificação)

### Rotas Disponíveis
- `GET /v1/notification-preferences/user/:userId` - Listar preferências do usuário
- `POST /v1/notification-preferences` - Criar preferência (Autenticado)
- `PATCH /v1/notification-preferences/:id` - Atualizar preferência (Autenticado)
- `DELETE /v1/notification-preferences/:id` - Excluir preferência (soft delete, Autenticado)

### Criar Preferência
```typescript
{
  userId: string;                 // UUID
  alertType: "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRING_SOON" | "EXPIRED" | "PRICE_CHANGE" | "REORDER_POINT";
  channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH";
  isEnabled?: boolean;            // Padrão: true
}
```

### Response
```typescript
{
  id: string;
  userId: string;
  alertType: string;
  channel: string;
  isEnabled: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
```

### Exemplo
```typescript
// Criar preferência de notificação por email para estoque baixo
const pref = await fetch('http://localhost:3333/v1/notification-preferences', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    alertType: 'LOW_STOCK',
    channel: 'EMAIL',
    isEnabled: true
  })
}).then(r => r.json());

// Desabilitar notificação
await fetch(`http://localhost:3333/v1/notification-preferences/${pref.id}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ isEnabled: false })
});
```
