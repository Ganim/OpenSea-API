# Label Templates API - Manual de Implementação Backend

## Visão Geral

Este documento descreve os endpoints necessários para o sistema de templates de etiquetas. O frontend já está implementado e aguarda estes endpoints.

**Base URL**: `/api/v1/label-templates`

---

## Schema do Banco de Dados

### Tabela: `label_templates`

```sql
CREATE TABLE label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  width INTEGER NOT NULL,           -- Largura em mm
  height INTEGER NOT NULL,          -- Altura em mm
  grapes_js_data TEXT NOT NULL,     -- JSON do projeto GrapesJS
  compiled_html TEXT,               -- HTML compilado para impressão
  compiled_css TEXT,                -- CSS compilado para impressão
  thumbnail_url VARCHAR(500),       -- URL da thumbnail gerada
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT label_templates_name_org_unique UNIQUE (organization_id, name, deleted_at),
  CONSTRAINT label_templates_width_check CHECK (width >= 10 AND width <= 300),
  CONSTRAINT label_templates_height_check CHECK (height >= 10 AND height <= 300)
);

-- Índices
CREATE INDEX idx_label_templates_org ON label_templates(organization_id);
CREATE INDEX idx_label_templates_system ON label_templates(is_system);
CREATE INDEX idx_label_templates_deleted ON label_templates(deleted_at) WHERE deleted_at IS NULL;
```

---

## Endpoints

### 1. Listar Templates

**GET** `/api/v1/label-templates`

Lista todos os templates da organização.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `includeSystem` | boolean | Não | Se `true`, inclui templates do sistema. Default: `true` |
| `search` | string | Não | Busca por nome ou descrição |
| `page` | number | Não | Página para paginação (default: 1) |
| `limit` | number | Não | Itens por página (default: 50) |

#### Response (200 OK)

```json
{
  "templates": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "organizationId": "org-123",
      "name": "Etiqueta Padrão",
      "description": "Template padrão para etiquetas de produto",
      "isSystem": true,
      "width": 60,
      "height": 40,
      "grapesJsData": "{...}",
      "compiledHtml": "<div>...</div>",
      "compiledCss": ".label { ... }",
      "thumbnailUrl": "https://storage.example.com/thumbnails/123.png",
      "createdBy": "user-123",
      "createdAt": "2024-01-14T10:00:00Z",
      "updatedAt": "2024-01-14T10:00:00Z"
    }
  ],
  "total": 15
}
```

---

### 2. Buscar Template por ID

**GET** `/api/v1/label-templates/:id`

Retorna um template específico.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do template |

#### Response (200 OK)

```json
{
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organizationId": "org-123",
    "name": "Etiqueta Padrão",
    "description": "Template padrão para etiquetas de produto",
    "isSystem": true,
    "width": 60,
    "height": 40,
    "grapesJsData": "{...}",
    "compiledHtml": "<div>...</div>",
    "compiledCss": ".label { ... }",
    "thumbnailUrl": "https://storage.example.com/thumbnails/123.png",
    "createdBy": "user-123",
    "createdAt": "2024-01-14T10:00:00Z",
    "updatedAt": "2024-01-14T10:00:00Z"
  }
}
```

#### Errors

| Status | Código | Descrição |
|--------|--------|-----------|
| 404 | `TEMPLATE_NOT_FOUND` | Template não encontrado |

---

### 3. Criar Template

**POST** `/api/v1/label-templates`

Cria um novo template customizado.

#### Request Body

```json
{
  "name": "Etiqueta Vestuário",
  "description": "Template para produtos de vestuário",
  "width": 50,
  "height": 30,
  "grapesJsData": "{\"pages\":[...],\"styles\":[...]}",
  "compiledHtml": "<div class=\"label\">...</div>",
  "compiledCss": ".label { font-size: 10px; }"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do template (máx 255 chars) |
| `description` | string | Não | Descrição do template |
| `width` | number | Sim | Largura em mm (10-300) |
| `height` | number | Sim | Altura em mm (10-300) |
| `grapesJsData` | string | Sim | JSON do projeto GrapesJS |
| `compiledHtml` | string | Não | HTML compilado |
| `compiledCss` | string | Não | CSS compilado |

#### Response (201 Created)

```json
{
  "template": {
    "id": "new-template-id",
    "organizationId": "org-123",
    "name": "Etiqueta Vestuário",
    "description": "Template para produtos de vestuário",
    "isSystem": false,
    "width": 50,
    "height": 30,
    "grapesJsData": "{...}",
    "compiledHtml": "<div>...</div>",
    "compiledCss": ".label { ... }",
    "thumbnailUrl": null,
    "createdBy": "user-123",
    "createdAt": "2024-01-14T10:00:00Z",
    "updatedAt": "2024-01-14T10:00:00Z"
  }
}
```

#### Errors

| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `INVALID_DIMENSIONS` | Dimensões fora do intervalo permitido |
| 400 | `NAME_REQUIRED` | Nome é obrigatório |
| 409 | `NAME_ALREADY_EXISTS` | Já existe um template com este nome |

---

### 4. Atualizar Template

**PATCH** `/api/v1/label-templates/:id`

Atualiza um template existente. Templates do sistema (`isSystem: true`) não podem ser atualizados.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do template |

#### Request Body

Todos os campos são opcionais:

```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "width": 60,
  "height": 40,
  "grapesJsData": "{...}",
  "compiledHtml": "<div>...</div>",
  "compiledCss": ".label { ... }"
}
```

#### Response (200 OK)

```json
{
  "template": {
    "id": "template-id",
    "name": "Novo Nome",
    ...
  }
}
```

#### Errors

| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `CANNOT_EDIT_SYSTEM_TEMPLATE` | Não é possível editar templates do sistema |
| 404 | `TEMPLATE_NOT_FOUND` | Template não encontrado |
| 409 | `NAME_ALREADY_EXISTS` | Já existe um template com este nome |

---

### 5. Deletar Template

**DELETE** `/api/v1/label-templates/:id`

Remove um template (soft delete). Templates do sistema não podem ser deletados.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do template |

#### Response (204 No Content)

Sem corpo na resposta.

#### Errors

| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `CANNOT_DELETE_SYSTEM_TEMPLATE` | Não é possível deletar templates do sistema |
| 404 | `TEMPLATE_NOT_FOUND` | Template não encontrado |

---

### 6. Duplicar Template

**POST** `/api/v1/label-templates/:id/duplicate`

Cria uma cópia de um template existente.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do template a duplicar |

#### Request Body

```json
{
  "name": "Nome da Cópia"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Não | Nome do novo template. Se não fornecido, usa "{nome original} (Cópia)" |

#### Response (201 Created)

```json
{
  "template": {
    "id": "new-copy-id",
    "name": "Nome da Cópia",
    "isSystem": false,
    ...
  }
}
```

#### Errors

| Status | Código | Descrição |
|--------|--------|-----------|
| 404 | `TEMPLATE_NOT_FOUND` | Template original não encontrado |
| 409 | `NAME_ALREADY_EXISTS` | Já existe um template com o nome da cópia |

---

### 7. Listar Templates do Sistema

**GET** `/api/v1/label-templates/system`

Lista apenas templates marcados como `isSystem: true`. Este endpoint é útil para mostrar templates pré-definidos que não podem ser editados.

#### Response (200 OK)

```json
{
  "templates": [
    {
      "id": "system-template-1",
      "name": "Etiqueta Padrão Pequena",
      "isSystem": true,
      "width": 40,
      "height": 25,
      ...
    },
    {
      "id": "system-template-2",
      "name": "Etiqueta Padrão Grande",
      "isSystem": true,
      "width": 100,
      "height": 60,
      ...
    }
  ],
  "total": 2
}
```

---

### 8. Gerar Thumbnail

**POST** `/api/v1/label-templates/:id/generate-thumbnail`

Gera uma imagem thumbnail do template. Esta operação pode ser assíncrona.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do template |

#### Response (200 OK)

```json
{
  "thumbnailUrl": "https://storage.example.com/thumbnails/abc123.png"
}
```

#### Implementação Sugerida

1. Renderizar o `compiledHtml` + `compiledCss` em um contexto headless (puppeteer/playwright)
2. Capturar screenshot
3. Fazer upload para storage (S3, GCS, etc.)
4. Atualizar o campo `thumbnailUrl` do template
5. Retornar a URL

---

## Templates do Sistema (Seed Data)

Sugestão de templates padrão para seed:

```typescript
const systemTemplates = [
  {
    name: 'Etiqueta Pequena (40x25mm)',
    description: 'Ideal para itens pequenos e joalheria',
    isSystem: true,
    width: 40,
    height: 25,
    grapesJsData: '{"pages":[{"component":{"type":"wrapper","components":[{"type":"text","content":"{{productName}}","style":{"font-size":"8px","font-weight":"bold"}},{"type":"text","content":"{{variantName}}","style":{"font-size":"7px"}},{"type":"text","content":"{{itemCode}}","style":{"font-size":"6px","margin-top":"2px"}}]}}]}',
    compiledHtml: '<div class="label"><div class="product-name">{{productName}}</div><div class="variant-name">{{variantName}}</div><div class="item-code">{{itemCode}}</div></div>',
    compiledCss: '.label{font-family:Arial,sans-serif;padding:2mm}.product-name{font-size:8px;font-weight:bold}.variant-name{font-size:7px}.item-code{font-size:6px;margin-top:2px}'
  },
  {
    name: 'Etiqueta Média (60x40mm)',
    description: 'Uso geral para produtos variados',
    isSystem: true,
    width: 60,
    height: 40,
    grapesJsData: '...',
    compiledHtml: '...',
    compiledCss: '...'
  },
  {
    name: 'Etiqueta com Código de Barras (80x50mm)',
    description: 'Inclui código de barras e QR code',
    isSystem: true,
    width: 80,
    height: 50,
    grapesJsData: '...',
    compiledHtml: '...',
    compiledCss: '...'
  },
  {
    name: 'Etiqueta Vestuário (50x30mm)',
    description: 'Otimizada para roupas e têxteis',
    isSystem: true,
    width: 50,
    height: 30,
    grapesJsData: '...',
    compiledHtml: '...',
    compiledCss: '...'
  }
];
```

---

## Permissões (RBAC)

Códigos de permissão sugeridos:

| Código | Descrição |
|--------|-----------|
| `label-templates.read` | Visualizar templates |
| `label-templates.create` | Criar templates customizados |
| `label-templates.update` | Editar templates customizados |
| `label-templates.delete` | Excluir templates customizados |
| `label-templates.duplicate` | Duplicar templates |

---

## Validações

### Nome
- Obrigatório
- Máximo 255 caracteres
- Único por organização (considerando soft delete)

### Dimensões
- `width`: 10-300 mm
- `height`: 10-300 mm

### GrapesJS Data
- Deve ser um JSON válido
- Estrutura esperada do GrapesJS v0.22+

---

## Considerações de Performance

1. **Índices**: Criar índices em `organization_id`, `is_system` e `deleted_at`
2. **Cache**: Templates do sistema podem ser cacheados por longos períodos
3. **Paginação**: Limitar retorno padrão a 50 itens
4. **Thumbnail**: Gerar thumbnails de forma assíncrona para não bloquear requests

---

## Exemplo de Uso no Frontend

```typescript
// Listar templates
const { templates } = await fetch('/api/v1/label-templates?includeSystem=true')
  .then(r => r.json());

// Criar template
await fetch('/api/v1/label-templates', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Meu Template',
    width: 60,
    height: 40,
    grapesJsData: editor.getProjectData()
  })
});

// Duplicar template do sistema
await fetch('/api/v1/label-templates/system-id/duplicate', {
  method: 'POST',
  body: JSON.stringify({ name: 'Minha Versão Customizada' })
});
```

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2024-01-14 | Versão inicial |
