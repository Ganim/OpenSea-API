# Módulo Label Templates - Guia de Implementação Frontend

Este documento descreve os endpoints, permissões e schemas para implementar o módulo de Label Templates no frontend.

## Visão Geral

O módulo de Label Templates permite criar, gerenciar e duplicar templates de etiquetas usando o editor GrapesJS. Os templates podem ser usados para gerar etiquetas de produtos, variantes e outros elementos do sistema.

## Endpoints

### CRUD de Label Templates

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `POST` | `/v1/label-templates` | Criar novo template | `core.label-templates.create` |
| `GET` | `/v1/label-templates` | Listar templates (paginado) | `core.label-templates.list` |
| `GET` | `/v1/label-templates/:id` | Obter template por ID | `core.label-templates.read` |
| `PUT` | `/v1/label-templates/:id` | Atualizar template | `core.label-templates.update` |
| `DELETE` | `/v1/label-templates/:id` | Deletar template (soft delete) | `core.label-templates.delete` |

### Templates de Sistema

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/v1/label-templates/system` | Listar templates de sistema | `core.label-templates.list` |

### Operações Especiais

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `POST` | `/v1/label-templates/:id/duplicate` | Duplicar template | `core.label-templates.duplicate` |
| `POST` | `/v1/label-templates/:id/thumbnail` | Gerar/atualizar thumbnail | `core.label-templates.update` |

---

## Schemas de Entrada

### POST /v1/label-templates - Criar Template

```typescript
interface CreateLabelTemplateRequest {
  name: string;              // Nome do template (max 255 caracteres)
  description?: string;      // Descrição opcional
  width: number;             // Largura em mm (10-300)
  height: number;            // Altura em mm (10-300)
  grapesJsData: string;      // JSON do editor GrapesJS
  compiledHtml?: string;     // HTML compilado
  compiledCss?: string;      // CSS compilado
}
```

### PUT /v1/label-templates/:id - Atualizar Template

```typescript
interface UpdateLabelTemplateRequest {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  grapesJsData?: string;
  compiledHtml?: string;
  compiledCss?: string;
}
```

### GET /v1/label-templates - Listar Templates (Query)

```typescript
interface ListLabelTemplatesQuery {
  page?: number;           // Default: 1
  limit?: number;          // Default: 20
  search?: string;         // Busca por nome
  includeSystem?: boolean; // Incluir templates de sistema
}
```

### POST /v1/label-templates/:id/duplicate - Duplicar Template

```typescript
interface DuplicateLabelTemplateRequest {
  name: string; // Nome do novo template
}
```

### POST /v1/label-templates/:id/thumbnail - Gerar Thumbnail

```typescript
interface GenerateThumbnailRequest {
  thumbnailUrl: string; // URL da imagem do thumbnail
}
```

---

## Schemas de Saída

### Label Template Response

```typescript
interface LabelTemplateResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  width: number;
  height: number;
  grapesJsData: string;
  compiledHtml: string | null;
  compiledCss: string | null;
  thumbnailUrl: string | null;
  organizationId: string;
  createdById: string;
  createdAt: string;           // ISO 8601
  updatedAt: string | null;
  deletedAt: string | null;
}
```

### Lista de Templates Response

```typescript
interface ListLabelTemplatesResponse {
  templates: LabelTemplateResponse[];
  total: number;
}
```

### Sistema Templates Response

```typescript
interface ListSystemTemplatesResponse {
  templates: LabelTemplateResponse[];
}
```

---

## Permissões

| Código | Descrição |
|--------|-----------|
| `core.label-templates.create` | Criar Templates de Etiquetas |
| `core.label-templates.read` | Visualizar Templates de Etiquetas |
| `core.label-templates.update` | Atualizar Templates de Etiquetas |
| `core.label-templates.delete` | Deletar Templates de Etiquetas |
| `core.label-templates.list` | Listar Templates de Etiquetas |
| `core.label-templates.duplicate` | Duplicar Templates de Etiquetas |
| `core.label-templates.manage` | Gerenciar Templates de Etiquetas |

---

## Templates de Sistema

Templates de sistema são templates pré-configurados que não podem ser editados ou deletados. Eles podem ser duplicados para criar templates personalizados.

### Características dos Templates de Sistema
- `isSystem: true`
- Não podem ser atualizados
- Não podem ser deletados
- Podem ser duplicados
- Visíveis para todas as organizações

---

## Códigos de Erro

| Código HTTP | Erro | Descrição |
|-------------|------|-----------|
| 400 | `INVALID_GRAPES_JS_DATA` | Dados do GrapesJS inválidos (não é JSON válido) |
| 400 | `INVALID_DIMENSIONS` | Dimensões fora do range permitido (10-300mm) |
| 400 | `TEMPLATE_NAME_EXISTS` | Já existe um template com esse nome na organização |
| 400 | `CANNOT_EDIT_SYSTEM_TEMPLATE` | Templates de sistema não podem ser editados |
| 400 | `CANNOT_DELETE_SYSTEM_TEMPLATE` | Templates de sistema não podem ser deletados |
| 404 | `LABEL_TEMPLATE_NOT_FOUND` | Template não encontrado |
| 401 | `Unauthorized` | Não autenticado |
| 403 | `Forbidden` | Sem permissão |

---

## Exemplo de Uso

### Criar Template

```typescript
const response = await fetch('/v1/label-templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Etiqueta Produto 100x50',
    description: 'Template para etiquetas de produtos',
    width: 100,
    height: 50,
    grapesJsData: JSON.stringify({ components: [], styles: [] }),
  }),
});

const { template } = await response.json();
// template.id, template.name, etc.
```

### Listar Templates

```typescript
const response = await fetch('/v1/label-templates?page=1&limit=20&includeSystem=true', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { templates, total } = await response.json();
```

### Obter Template por ID

```typescript
const response = await fetch(`/v1/label-templates/${templateId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { template } = await response.json();
```

### Atualizar Template

```typescript
const response = await fetch(`/v1/label-templates/${templateId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Novo Nome do Template',
    width: 150,
    height: 75,
  }),
});

const { template } = await response.json();
```

### Duplicar Template

```typescript
const response = await fetch(`/v1/label-templates/${templateId}/duplicate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Cópia do Template',
  }),
});

const { template } = await response.json();
// template.id é um novo ID, diferente do original
```

### Listar Templates de Sistema

```typescript
const response = await fetch('/v1/label-templates/system', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { templates } = await response.json();
// Todos os templates terão isSystem: true
```

### Atualizar Thumbnail

```typescript
const response = await fetch(`/v1/label-templates/${templateId}/thumbnail`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    thumbnailUrl: 'https://storage.example.com/thumbnails/template-123.png',
  }),
});

const { template } = await response.json();
// template.thumbnailUrl agora está atualizado
```

---

## Integração com GrapesJS

O campo `grapesJsData` armazena o estado completo do editor GrapesJS como JSON. Este campo deve ser sincronizado com o estado do editor no frontend.

### Exemplo de Estrutura do GrapesJS Data

```typescript
interface GrapesJsData {
  components: any[];  // Componentes do editor
  styles: any[];      // Estilos CSS
  // Outros dados do estado do editor
}
```

### Salvando o Editor

```typescript
// Obtém o estado do editor
const grapesJsData = JSON.stringify(editor.getProjectData());

// Salva no backend
await fetch(`/v1/label-templates/${templateId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ grapesJsData }),
});
```

### Carregando o Editor

```typescript
// Carrega o template
const response = await fetch(`/v1/label-templates/${templateId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { template } = await response.json();

// Carrega no editor
editor.loadProjectData(JSON.parse(template.grapesJsData));
```

---

## Campos Compilados (HTML/CSS)

Os campos `compiledHtml` e `compiledCss` são opcionais e podem ser usados para armazenar o HTML e CSS gerados pelo editor para renderização rápida das etiquetas sem necessidade de processar o `grapesJsData`.

```typescript
// Após gerar a etiqueta no editor
const html = editor.getHtml();
const css = editor.getCss();

await fetch(`/v1/label-templates/${templateId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    compiledHtml: html,
    compiledCss: css,
  }),
});
```
