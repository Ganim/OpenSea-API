# Stock - Categories (Categorias)

Rotas para gerenciar categorias de produtos.

## Operações CRUD Padrão

### GET /v1/categories
Listar todas as categorias.

**Permissões:** Autenticado

### GET /v1/categories/:id
Obter categoria por ID.

**Permissões:** Autenticado

### POST /v1/categories
Criar nova categoria.

**Permissões:** MANAGER

**Request Body:**
```typescript
{
  name: string;           // 1-128 caracteres
  slug?: string;          // 1-128 caracteres (gerado automaticamente se não fornecido)
  description?: string;   // Máx 500 caracteres
  parentId?: string;      // UUID da categoria pai (para subcategorias)
  displayOrder?: number;  // Ordem de exibição (inteiro >= 0)
  isActive?: boolean;     // Padrão: true
}
```

### PATCH /v1/categories/:id
Atualizar categoria.

**Permissões:** MANAGER

### DELETE /v1/categories/:id
Excluir categoria (soft delete).

**Permissões:** ADMIN

---

## Exemplo de Uso

```typescript
// Criar categoria principal
const category = await fetch('http://localhost:3333/v1/categories', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Eletrônicos',
    description: 'Produtos eletrônicos',
    displayOrder: 1,
    isActive: true
  })
}).then(r => r.json());

// Criar subcategoria
const subcategory = await fetch('http://localhost:3333/v1/categories', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Smartphones',
    parentId: category.category.id,
    displayOrder: 1
  })
}).then(r => r.json());
```
