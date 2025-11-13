# Stock - Manufacturers, Suppliers, Locations, Tags, Templates

Rotas para gerenciar fabricantes, fornecedores, locais de armazenamento, tags e templates.

## Manufacturers (Fabricantes)

### Rotas Disponíveis
- `GET /v1/manufacturers` - Listar fabricantes
- `GET /v1/manufacturers/:id` - Obter fabricante por ID
- `POST /v1/manufacturers` - Criar fabricante (MANAGER)
- `PATCH /v1/manufacturers/:id` - Atualizar fabricante (MANAGER)
- `DELETE /v1/manufacturers/:id` - Excluir fabricante (ADMIN)

### Criar Fabricante
```typescript
{
  name: string;            // 1-255 caracteres
  country: string;         // 1-100 caracteres
  email?: string;          // Email válido
  phone?: string;          // Máx 20 caracteres
  website?: string;        // URL válida
  addressLine1?: string;   // Máx 255 caracteres
  addressLine2?: string;   // Máx 255 caracteres
  city?: string;           // Máx 100 caracteres
  state?: string;          // Máx 100 caracteres
  postalCode?: string;     // Máx 20 caracteres
  isActive?: boolean;
  rating?: number;         // 0-5
  notes?: string;          // Máx 1000 caracteres
}
```

---

## Suppliers (Fornecedores)

### Rotas Disponíveis
- `GET /v1/suppliers` - Listar fornecedores
- `GET /v1/suppliers/:id` - Obter fornecedor por ID
- `POST /v1/suppliers` - Criar fornecedor (MANAGER)
- `PATCH /v1/suppliers/:id` - Atualizar fornecedor (MANAGER)
- `DELETE /v1/suppliers/:id` - Excluir fornecedor (ADMIN)

### Criar Fornecedor
```typescript
{
  name: string;           // 1-255 caracteres
  cnpj?: string;
  taxId?: string;         // Máx 50 caracteres
  contact?: string;       // Máx 255 caracteres
  email?: string;         // Email válido
  phone?: string;         // Máx 20 caracteres
  website?: string;       // URL válida
  address?: string;       // Máx 255 caracteres
  city?: string;          // Máx 100 caracteres
  state?: string;         // Máx 100 caracteres
  zipCode?: string;       // Máx 20 caracteres
  country?: string;       // Máx 100 caracteres
  paymentTerms?: string;  // Máx 255 caracteres
  rating?: number;        // 0-5
  isActive?: boolean;
  notes?: string;
}
```

---

## Locations (Locais de Armazenamento)

### Rotas Disponíveis
- `GET /v1/locations` - Listar locais
- `GET /v1/locations/:id` - Obter local por ID
- `POST /v1/locations` - Criar local (MANAGER)
- `PATCH /v1/locations/:id` - Atualizar local (MANAGER)
- `DELETE /v1/locations/:id` - Excluir local (ADMIN)

### Criar Local
```typescript
{
  code: string;                   // 1-100 caracteres, único
  description?: string;           // Máx 255 caracteres
  locationType?: "WAREHOUSE" | "ZONE" | "AISLE" | "SHELF" | "BIN" | "OTHER";
  parentId?: string;              // UUID do local pai
  capacity?: number;              // Capacidade (inteiro >= 0)
  currentOccupancy?: number;      // Ocupação atual (inteiro >= 0)
}
```

---

## Tags (Etiquetas)

### Rotas Disponíveis
- `GET /v1/tags` - Listar tags
- `GET /v1/tags/:id` - Obter tag por ID
- `POST /v1/tags` - Criar tag (MANAGER)
- `PATCH /v1/tags/:id` - Atualizar tag (MANAGER)
- `DELETE /v1/tags/:id` - Excluir tag (ADMIN)

### Criar Tag
```typescript
{
  name: string;        // 1-50 caracteres
  color?: string;      // Hex color (#RRGGBB)
  description?: string; // Máx 500 caracteres
}
```

---

## Templates (Templates de Atributos)

### Rotas Disponíveis
- `GET /v1/templates` - Listar templates
- `GET /v1/templates/:id` - Obter template por ID
- `POST /v1/templates` - Criar template (MANAGER)
- `PATCH /v1/templates/:id` - Atualizar template (MANAGER)
- `DELETE /v1/templates/:id` - Excluir template (ADMIN)

### Criar Template
```typescript
{
  name: string;                      // 1-100 caracteres
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}
```

### Exemplo de Template
```typescript
{
  name: "Roupas",
  productAttributes: {
    category: "string",
    brand: "string"
  },
  variantAttributes: {
    color: "string",
    size: "string"
  },
  itemAttributes: {
    condition: "string"
  }
}
```

---

## Purchase Orders (Ordens de Compra)

### Rotas Disponíveis
- `GET /v1/purchase-orders` - Listar ordens de compra
- `GET /v1/purchase-orders/:id` - Obter ordem por ID
- `POST /v1/purchase-orders` - Criar ordem (MANAGER)
- `PATCH /v1/purchase-orders/:id/status` - Atualizar status (MANAGER)

### Criar Ordem de Compra
```typescript
{
  orderNumber: string;          // 1-100 caracteres
  supplierId: string;           // UUID
  expectedDate?: Date;
  status?: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED";  // Padrão: "PENDING"
  notes?: string;               // Máx 1000 caracteres
  items: Array<{
    variantId: string;          // UUID
    quantity: number;           // Inteiro positivo
    unitCost: number;           // Custo unitário positivo
  }>;                           // Mínimo 1 item
}
```

### Atualizar Status
```typescript
{
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
}
```
