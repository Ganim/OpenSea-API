# Módulo Volumes / Romaneio - Guia de Implementação Frontend

Este documento descreve os endpoints, permissões e schemas para implementar o módulo de Volumes no frontend.

## Visão Geral

O módulo de Volumes permite agrupar itens de estoque em volumes para expedição e gerar romaneios de entrega.

## Endpoints

### CRUD de Volumes

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `POST` | `/v1/volumes` | Criar novo volume | `stock.volumes.create` |
| `GET` | `/v1/volumes` | Listar volumes (paginado) | `stock.volumes.list` |
| `GET` | `/v1/volumes/:id` | Obter volume por ID | `stock.volumes.read` |
| `PUT` | `/v1/volumes/:id` | Atualizar volume | `stock.volumes.update` |
| `DELETE` | `/v1/volumes/:id` | Deletar volume (soft delete) | `stock.volumes.delete` |

### Gestão de Itens

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `POST` | `/v1/volumes/:id/items` | Adicionar item ao volume | `stock.volumes.add-item` |
| `DELETE` | `/v1/volumes/:id/items/:itemId` | Remover item do volume | `stock.volumes.remove-item` |

### Fluxo de Status

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `POST` | `/v1/volumes/:id/close` | Fechar volume | `stock.volumes.close` |
| `POST` | `/v1/volumes/:id/reopen` | Reabrir volume | `stock.volumes.reopen` |
| `POST` | `/v1/volumes/:id/deliver` | Marcar como entregue | `stock.volumes.deliver` |
| `POST` | `/v1/volumes/:id/return` | Marcar como retornado | `stock.volumes.return` |

### Romaneio

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/v1/volumes/:id/romaneio` | Obter romaneio do volume | `stock.volumes.romaneio` |

---

## Schemas de Entrada

### POST /v1/volumes - Criar Volume

```typescript
interface CreateVolumeRequest {
  name?: string;          // Nome opcional do volume
  notes?: string;         // Observações
  destinationRef?: string; // Referência do destino
  salesOrderId?: string;  // UUID do pedido de venda
  customerId?: string;    // UUID do cliente
  status?: VolumeStatus;  // Status inicial (opcional)
}

type VolumeStatus = 'OPEN' | 'CLOSED' | 'DELIVERED' | 'RETURNED';
```

### PUT /v1/volumes/:id - Atualizar Volume

```typescript
interface UpdateVolumeRequest {
  name?: string;
  notes?: string;
  destinationRef?: string;
  status?: VolumeStatus;
}
```

### GET /v1/volumes - Listar Volumes (Query)

```typescript
interface ListVolumesQuery {
  page?: number;      // Default: 1
  limit?: number;     // Default: 20
  status?: VolumeStatus;
}
```

### POST /v1/volumes/:id/items - Adicionar Item

```typescript
interface AddItemToVolumeRequest {
  itemId: string; // UUID do item
}
```

---

## Schemas de Saída

### Volume Response

```typescript
interface VolumeResponse {
  id: string;
  code: string;                // Código único (ex: VOL-2025-001)
  name: string | null;
  status: VolumeStatus;
  statusLabel: string;         // Label traduzido (ex: "Aberto")
  notes: string | null;
  destinationRef: string | null;
  salesOrderId: string | null;
  customerId: string | null;
  createdAt: string;           // ISO 8601
  updatedAt: string;
  closedAt: string | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  deletedAt: string | null;
  createdBy: string;
  closedBy: string | null;
  deliveredBy: string | null;
}
```

### Lista de Volumes Response

```typescript
interface ListVolumesResponse {
  volumes: VolumeResponse[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}
```

### Volume Item Response

```typescript
interface VolumeItemResponse {
  id: string;
  volumeId: string;
  itemId: string;
  addedAt: string;
  addedBy: string;
}
```

### Romaneio Response

```typescript
interface RomaneioResponse {
  romaneio: {
    volumeId: string;
    volumeCode: string;
    totalItems: number;
    items: VolumeItemResponse[];
    generatedAt: string;
  };
}
```

---

## Permissões

| Código | Descrição |
|--------|-----------|
| `stock.volumes.create` | Criar Volumes |
| `stock.volumes.read` | Visualizar Volumes |
| `stock.volumes.update` | Atualizar Volumes |
| `stock.volumes.delete` | Deletar Volumes |
| `stock.volumes.list` | Listar Volumes |
| `stock.volumes.manage` | Gerenciar Volumes |
| `stock.volumes.close` | Fechar Volumes |
| `stock.volumes.reopen` | Reabrir Volumes |
| `stock.volumes.deliver` | Entregar Volumes |
| `stock.volumes.return` | Retornar Volumes |
| `stock.volumes.add-item` | Adicionar Item ao Volume |
| `stock.volumes.remove-item` | Remover Item do Volume |
| `stock.volumes.romaneio` | Visualizar Romaneio |

---

## Fluxo de Status

```
           ┌──────────────┐
           │     OPEN     │ ◄──────────────────┐
           └──────┬───────┘                    │
                  │ close                      │ reopen
                  ▼                            │
           ┌──────────────┐                    │
           │    CLOSED    │ ───────────────────┘
           └──────┬───────┘
                  │ deliver
                  ▼
           ┌──────────────┐
           │   DELIVERED  │
           └──────┬───────┘
                  │ return
                  ▼
           ┌──────────────┐
           │   RETURNED   │
           └──────────────┘
```

### Regras de Transição de Status

1. **OPEN → CLOSED**: `POST /v1/volumes/:id/close`
2. **CLOSED → OPEN**: `POST /v1/volumes/:id/reopen`
3. **CLOSED → DELIVERED**: `POST /v1/volumes/:id/deliver`
4. **DELIVERED → RETURNED**: `POST /v1/volumes/:id/return`

---

## Códigos de Erro

| Código HTTP | Erro | Descrição |
|-------------|------|-----------|
| 400 | `VOLUME_ALREADY_EXISTS` | Código do volume já existe |
| 400 | `VOLUME_CANNOT_BE_CLOSED` | Volume não pode ser fechado (status inválido) |
| 400 | `VOLUME_ITEM_ALREADY_EXISTS` | Item já está no volume |
| 400 | `VOLUME_ITEM_NOT_FOUND` | Item não encontrado no volume |
| 400 | `INVALID_VOLUME_STATUS` | Status do volume inválido |
| 404 | `VOLUME_NOT_FOUND` | Volume não encontrado |
| 401 | `Unauthorized` | Não autenticado |
| 403 | `Forbidden` | Sem permissão |

---

## Exemplo de Uso

### Criar Volume

```typescript
const response = await fetch('/v1/volumes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Volume Pedido #1234',
    notes: 'Pedido urgente',
    destinationRef: 'Cliente ABC - São Paulo, SP',
  }),
});

const { volume } = await response.json();
// volume.code = "VOL-2025-001"
```

### Adicionar Item ao Volume

```typescript
const response = await fetch(`/v1/volumes/${volumeId}/items`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    itemId: 'item-uuid',
  }),
});
```

### Fechar e Entregar Volume

```typescript
// Fechar volume
await fetch(`/v1/volumes/${volumeId}/close`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});

// Marcar como entregue
await fetch(`/v1/volumes/${volumeId}/deliver`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### Obter Romaneio

```typescript
const response = await fetch(`/v1/volumes/${volumeId}/romaneio`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { romaneio } = await response.json();
// romaneio.volumeCode, romaneio.totalItems, romaneio.items, etc.
```
