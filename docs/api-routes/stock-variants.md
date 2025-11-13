# Stock - Variants (Variantes de Produtos)

Rotas para gerenciar variantes de produtos.

## GET /v1/variants
Listar todas as variantes.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Response 200
```typescript
{
  variants: Array<{
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    imageUrl?: string;
    attributes: Record<string, unknown>;
    costPrice?: number;
    profitMargin?: number;
    barcode?: string;
    qrCode?: string;
    eanCode?: string;
    upcCode?: string;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }>;
}
```

---

## GET /v1/variants/:id
Obter variante por ID.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Params
- `id` (string, UUID)

### Response 200
```typescript
{
  variant: object;
}
```

---

## POST /v1/variants
Criar nova variante.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Request Body
```typescript
{
  productId: string;              // UUID
  sku: string;                    // 1-100 caracteres, único
  name: string;                   // 1-255 caracteres
  price: number;                  // Preço positivo
  imageUrl?: string;              // URL válida
  attributes?: Record<string, unknown>;
  costPrice?: number;             // Custo positivo
  profitMargin?: number;          // Margem de lucro
  barcode?: string;               // Máx 100 caracteres
  qrCode?: string;                // Máx 100 caracteres
  eanCode?: string;               // Máx 100 caracteres
  upcCode?: string;               // Máx 100 caracteres
  minStock?: number;              // Estoque mínimo (inteiro >= 0)
  maxStock?: number;              // Estoque máximo (inteiro >= 0)
  reorderPoint?: number;          // Ponto de reposição (inteiro >= 0)
  reorderQuantity?: number;       // Quantidade de reposição (inteiro >= 0)
}
```

### Response 201
```typescript
{
  variant: object;
}
```

---

## PATCH /v1/variants/:id
Atualizar variante.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Params
- `id` (string, UUID)

### Request Body
```typescript
{
  sku?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}
```

### Response 200
```typescript
{
  variant: object;
}
```

---

## DELETE /v1/variants/:id
Excluir variante (soft delete).

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `id` (string, UUID)

### Response 204
Sem corpo de resposta.

---

## Exemplo de Uso

```typescript
// Criar variante
const variant = await fetch('http://localhost:3333/v1/variants', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'product-uuid',
    sku: 'VAR-001-BLUE-M',
    name: 'Produto Azul Tamanho M',
    price: 99.90,
    costPrice: 50.00,
    profitMargin: 99.8,
    attributes: {
      color: 'blue',
      size: 'M'
    },
    minStock: 10,
    reorderPoint: 5,
    reorderQuantity: 20
  })
}).then(r => r.json());
```
