# Sales - Customers (Clientes)

Rotas para gerenciar clientes.

## GET /v1/customers
Listar todos os clientes.

**Permissões:** Autenticado

### Response 200
```typescript
{
  customers: Array<{
    id: string;
    name: string;
    type: "INDIVIDUAL" | "BUSINESS";
    document?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }>;
}
```

---

## GET /v1/customers/:id
Obter cliente por ID.

**Permissões:** Autenticado

### Params
- `id` (string, UUID)

### Response 200
```typescript
{
  customer: object;
}
```

---

## POST /v1/customers
Criar novo cliente.

**Permissões:** Autenticado

### Request Body
```typescript
{
  name: string;                    // 1-128 caracteres
  type: "INDIVIDUAL" | "BUSINESS";
  document?: string;               // CPF/CNPJ
  email?: string;                  // Email válido, máx 254 caracteres
  phone?: string;                  // Máx 20 caracteres
  address?: string;                // Máx 256 caracteres
  city?: string;                   // Máx 128 caracteres
  state?: string;                  // 2 caracteres (UF)
  zipCode?: string;                // Máx 10 caracteres
  country?: string;                // Máx 64 caracteres
  notes?: string;
}
```

### Response 201
```typescript
{
  customer: object;
}
```

---

## PATCH /v1/customers/:id
Atualizar cliente.

**Permissões:** Autenticado

### Params
- `id` (string, UUID)

### Request Body
```typescript
{
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
}
```

### Response 200
```typescript
{
  customer: object;
}
```

---

## DELETE /v1/customers/:id
Excluir cliente (soft delete).

**Permissões:** ADMIN

### Params
- `id` (string, UUID)

### Response 204
Sem corpo de resposta.

---

## Exemplo de Uso

```typescript
// Criar cliente pessoa física
const customer = await fetch('http://localhost:3333/v1/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    type: 'INDIVIDUAL',
    document: '123.456.789-00',
    email: 'joao@example.com',
    phone: '+55 11 98765-4321',
    address: 'Rua Exemplo, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    country: 'Brasil'
  })
}).then(r => r.json());

// Criar cliente pessoa jurídica
const business = await fetch('http://localhost:3333/v1/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Empresa XYZ Ltda',
    type: 'BUSINESS',
    document: '12.345.678/0001-90',
    email: 'contato@empresa.com',
    phone: '+55 11 3456-7890'
  })
}).then(r => r.json());
```
