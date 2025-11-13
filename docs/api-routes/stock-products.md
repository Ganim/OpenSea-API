# Stock - Products (Produtos)

Rotas para gerenciar produtos.

## GET /v1/products
Listar todos os produtos.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Response 200
```typescript
{
  products: Array<{
    id: string;
    name: string;
    code: string;
    description?: string;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
    unitOfMeasure: "METERS" | "KILOGRAMS" | "UNITS";
    attributes: Record<string, any>;
    templateId: string;
    supplierId?: string;
    manufacturerId?: string;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }>;
}
```

---

## GET /v1/products/:productId
Obter produto por ID.

**Permissões:** Autenticado  
**Rate Limit:** Query

### Params
- `productId` (string, UUID)

### Response 200
```typescript
{
  product: {
    id: string;
    name: string;
    code: string;
    // ... demais campos
  };
}
```

---

## POST /v1/products
Criar novo produto.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Request Body
```typescript
{
  name: string;                        // 2-100 caracteres
  code: string;                        // 1-50 caracteres, único
  description?: string;                // Máx 1000 caracteres
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";  // Padrão: "ACTIVE"
  unitOfMeasure: "METERS" | "KILOGRAMS" | "UNITS";
  attributes?: Record<string, any>;
  templateId: string;                  // UUID do template
  supplierId?: string;                 // UUID do fornecedor
  manufacturerId?: string;             // UUID do fabricante
}
```

### Response 201
```typescript
{
  product: object;
}
```

---

## PATCH /v1/products/:productId
Atualizar produto.

**Permissões:** MANAGER  
**Rate Limit:** Mutation

### Params
- `productId` (string, UUID)

### Request Body
```typescript
{
  name?: string;
  code?: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  unitOfMeasure?: "METERS" | "KILOGRAMS" | "UNITS";
  attributes?: Record<string, any>;
  templateId?: string;
  supplierId?: string;
  manufacturerId?: string;
}
```

### Response 200
```typescript
{
  product: object;
}
```

---

## DELETE /v1/products/:productId
Excluir produto (soft delete).

**Permissões:** ADMIN  
**Rate Limit:** Admin

### Params
- `productId` (string, UUID)

### Response 204
Sem corpo de resposta.

---

## Exemplo de Uso

```typescript
// Listar produtos
const products = await fetch('http://localhost:3333/v1/products', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Criar produto
const newProduct = await fetch('http://localhost:3333/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Produto Exemplo',
    code: 'PROD-001',
    description: 'Descrição do produto',
    status: 'ACTIVE',
    unitOfMeasure: 'UNITS',
    templateId: 'template-uuid',
    attributes: {
      color: 'blue',
      size: 'M'
    }
  })
}).then(r => r.json());

// Atualizar produto
const updated = await fetch(`http://localhost:3333/v1/products/${productId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'INACTIVE'
  })
}).then(r => r.json());
```
