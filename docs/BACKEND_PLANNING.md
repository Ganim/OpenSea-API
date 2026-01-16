# Backend Planning - Endpoints Pendentes

Este documento descreve os endpoints, permissões e requisitos para implementar os módulos que ainda não possuem API no backend.

## Sumário

1. [Volumes / Romaneio](#1-volumes--romaneio)
2. [Inventário (Inventory Cycles)](#2-inventário-inventory-cycles)
3. [Analytics de Estoque](#3-analytics-de-estoque)
4. [Purchase Orders (Complementos)](#4-purchase-orders-complementos)

---

## 1. Volumes / Romaneio

Sistema para agrupar itens em volumes para expedição e gerar romaneios de entrega.

### 1.1 Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/v1/volumes` | Listar todos os volumes | `volumes:read` |
| `GET` | `/v1/volumes/{volumeId}` | Obter volume por ID | `volumes:read` |
| `POST` | `/v1/volumes` | Criar novo volume | `volumes:create` |
| `PATCH` | `/v1/volumes/{volumeId}` | Atualizar volume | `volumes:update` |
| `DELETE` | `/v1/volumes/{volumeId}` | Deletar volume | `volumes:delete` |
| `POST` | `/v1/volumes/{volumeId}/items` | Adicionar item ao volume | `volumes:update` |
| `DELETE` | `/v1/volumes/{volumeId}/items/{itemId}` | Remover item do volume | `volumes:update` |
| `POST` | `/v1/volumes/{volumeId}/close` | Fechar volume | `volumes:update` |
| `POST` | `/v1/volumes/{volumeId}/reopen` | Reabrir volume | `volumes:update` |
| `POST` | `/v1/volumes/{volumeId}/deliver` | Marcar como entregue | `volumes:update` |
| `POST` | `/v1/volumes/{volumeId}/return` | Marcar como retornado | `volumes:update` |
| `GET` | `/v1/volumes/{volumeId}/romaneio` | Gerar/obter romaneio | `volumes:read` |
| `GET` | `/v1/volumes/{volumeId}/romaneio/pdf` | Gerar PDF do romaneio | `volumes:read` |

### 1.2 Schemas

#### Volume
```typescript
interface Volume {
  id: string;
  code: string;                    // Código único (ex: VOL-2025-001)
  name?: string;                   // Nome opcional
  status: VolumeStatus;            // OPEN, CLOSED, DELIVERED, RETURNED
  notes?: string;                  // Observações
  itemCount: number;               // Contagem de itens
  destinationRef?: string;         // Referência do destino (cliente, filial, etc.)

  // Relacionamentos
  salesOrderId?: string;           // ID da ordem de venda associada
  customerId?: string;             // ID do cliente de destino

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  deliveredAt?: Date;
  returnedAt?: Date;

  // Audit
  createdBy: string;
  closedBy?: string;
  deliveredBy?: string;
}

type VolumeStatus = 'OPEN' | 'CLOSED' | 'DELIVERED' | 'RETURNED';

interface VolumeItem {
  id: string;
  volumeId: string;
  itemId: string;
  addedAt: Date;
  addedBy: string;

  // Populated
  item?: Item;
}
```

#### Romaneio
```typescript
interface Romaneio {
  volumeId: string;
  generatedAt: Date;
  volume: {
    code: string;
    name?: string;
    destinationRef?: string;
  };
  items: RomaneioItem[];
  totalItems: number;
}

interface RomaneioItem {
  item: {
    id: string;
    uniqueCode: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
  };
  variant: {
    id: string;
    name: string;
    sku: string;
  };
}
```

### 1.3 Request/Response

#### POST /v1/volumes
```json
// Request
{
  "name": "Volume Pedido #1234",
  "notes": "Pedido urgente",
  "destinationRef": "Cliente ABC - São Paulo, SP",
  "salesOrderId": "order-uuid",
  "customerId": "customer-uuid"
}

// Response 201
{
  "volume": {
    "id": "vol-uuid",
    "code": "VOL-2025-001",
    "name": "Volume Pedido #1234",
    "status": "OPEN",
    "itemCount": 0,
    ...
  }
}
```

#### GET /v1/volumes
```json
// Query Params
{
  "page": 1,
  "limit": 20,
  "status": "OPEN",           // Filtro por status
  "search": "VOL-2025",       // Busca por código/nome
  "salesOrderId": "uuid",     // Filtro por pedido
  "customerId": "uuid",       // Filtro por cliente
  "fromDate": "2025-01-01",   // Data inicial
  "toDate": "2025-01-31"      // Data final
}

// Response
{
  "volumes": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /v1/volumes/{volumeId}/items
```json
// Request
{
  "itemId": "item-uuid"
}

// Response 201
{
  "volumeItem": {
    "id": "vi-uuid",
    "volumeId": "vol-uuid",
    "itemId": "item-uuid",
    "addedAt": "2025-01-15T10:00:00Z"
  }
}

// Error 400 - Item já está em outro volume
{
  "error": "ITEM_ALREADY_IN_VOLUME",
  "message": "Item já está associado ao volume VOL-2025-002"
}
```

### 1.4 Regras de Negócio

1. **Criação de Volume**
   - Código é gerado automaticamente (VOL-YYYY-NNN)
   - Status inicial sempre é `OPEN`

2. **Adição de Itens**
   - Item só pode estar em um volume de cada vez
   - Apenas volumes com status `OPEN` aceitam novos itens
   - Item deve existir e estar disponível no estoque

3. **Fechamento de Volume**
   - Volume deve ter pelo menos 1 item
   - Gera automaticamente o romaneio
   - Atualiza `closedAt` e `closedBy`

4. **Reabertura de Volume**
   - Apenas volumes `CLOSED` podem ser reabertos
   - Volumes `DELIVERED` ou `RETURNED` não podem ser reabertos

5. **Entrega de Volume**
   - Apenas volumes `CLOSED` podem ser marcados como entregues
   - Atualiza status dos itens para `SOLD` ou similar

6. **Retorno de Volume**
   - Apenas volumes `CLOSED` ou `DELIVERED` podem ser retornados
   - Itens voltam ao status anterior (disponível)

### 1.5 Database Schema (Prisma)

```prisma
model Volume {
  id             String        @id @default(uuid())
  code           String        @unique
  name           String?
  status         VolumeStatus  @default(OPEN)
  notes          String?
  destinationRef String?

  salesOrderId   String?
  salesOrder     SalesOrder?   @relation(fields: [salesOrderId], references: [id])

  customerId     String?
  customer       Customer?     @relation(fields: [customerId], references: [id])

  items          VolumeItem[]

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  closedAt       DateTime?
  deliveredAt    DateTime?
  returnedAt     DateTime?

  createdBy      String
  createdByUser  User          @relation("VolumeCreatedBy", fields: [createdBy], references: [id])

  closedBy       String?
  closedByUser   User?         @relation("VolumeClosedBy", fields: [closedBy], references: [id])

  deliveredBy    String?
  deliveredByUser User?        @relation("VolumeDeliveredBy", fields: [deliveredBy], references: [id])

  @@index([status])
  @@index([salesOrderId])
  @@index([customerId])
  @@index([code])
}

model VolumeItem {
  id        String   @id @default(uuid())
  volumeId  String
  volume    Volume   @relation(fields: [volumeId], references: [id], onDelete: Cascade)
  itemId    String
  item      Item     @relation(fields: [itemId], references: [id])
  addedAt   DateTime @default(now())
  addedBy   String

  @@unique([volumeId, itemId])
  @@index([itemId])
}

enum VolumeStatus {
  OPEN
  CLOSED
  DELIVERED
  RETURNED
}
```

---

## 2. Inventário (Inventory Cycles)

Sistema para realizar contagens de inventário e reconciliação de estoque.

### 2.1 Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/v1/inventory-cycles` | Listar ciclos de inventário | `inventory:read` |
| `GET` | `/v1/inventory-cycles/{cycleId}` | Obter ciclo por ID | `inventory:read` |
| `POST` | `/v1/inventory-cycles` | Criar novo ciclo | `inventory:create` |
| `PATCH` | `/v1/inventory-cycles/{cycleId}` | Atualizar ciclo | `inventory:update` |
| `DELETE` | `/v1/inventory-cycles/{cycleId}` | Deletar ciclo | `inventory:delete` |
| `POST` | `/v1/inventory-cycles/{cycleId}/start` | Iniciar contagem | `inventory:update` |
| `POST` | `/v1/inventory-cycles/{cycleId}/complete` | Finalizar ciclo | `inventory:update` |
| `POST` | `/v1/inventory-cycles/{cycleId}/cancel` | Cancelar ciclo | `inventory:update` |
| `GET` | `/v1/inventory-cycles/{cycleId}/counts` | Listar contagens | `inventory:read` |
| `POST` | `/v1/inventory-cycles/{cycleId}/counts` | Registrar contagem | `inventory:update` |
| `PATCH` | `/v1/inventory-cycles/{cycleId}/counts/{countId}` | Atualizar contagem | `inventory:update` |
| `GET` | `/v1/inventory-cycles/{cycleId}/discrepancies` | Listar discrepâncias | `inventory:read` |
| `POST` | `/v1/inventory-cycles/{cycleId}/reconcile` | Reconciliar estoque | `inventory:reconcile` |
| `GET` | `/v1/inventory-cycles/{cycleId}/report` | Gerar relatório | `inventory:read` |

### 2.2 Schemas

```typescript
interface InventoryCycle {
  id: string;
  name: string;
  description?: string;
  status: InventoryCycleStatus;
  type: InventoryCycleType;

  // Escopo
  warehouseId?: string;       // Armazém específico
  zoneIds?: string[];         // Zonas específicas
  categoryIds?: string[];     // Categorias específicas

  // Timestamps
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Estatísticas
  totalItems: number;
  countedItems: number;
  discrepancyCount: number;

  // Audit
  createdBy: string;
  startedBy?: string;
  completedBy?: string;
}

type InventoryCycleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type InventoryCycleType = 'FULL' | 'PARTIAL' | 'CYCLE_COUNT' | 'SPOT_CHECK';

interface InventoryCount {
  id: string;
  cycleId: string;
  binId: string;
  itemId?: string;
  variantId?: string;

  expectedQuantity: number;
  countedQuantity: number;
  discrepancy: number;

  notes?: string;
  countedAt: Date;
  countedBy: string;

  // Populated
  bin?: Bin;
  item?: Item;
  variant?: Variant;
}

interface InventoryDiscrepancy {
  id: string;
  countId: string;
  cycleId: string;

  itemId?: string;
  variantId?: string;
  binId: string;

  expectedQuantity: number;
  countedQuantity: number;
  difference: number;

  status: DiscrepancyStatus;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

type DiscrepancyStatus = 'PENDING' | 'REVIEWED' | 'ADJUSTED' | 'IGNORED';
```

### 2.3 Request/Response

#### POST /v1/inventory-cycles
```json
// Request
{
  "name": "Inventário Q1 2025",
  "description": "Contagem trimestral de estoque",
  "type": "FULL",
  "scheduledDate": "2025-03-01T08:00:00Z",
  "warehouseId": "wh-uuid",
  "zoneIds": ["zone-1", "zone-2"],
  "categoryIds": ["cat-1"]
}

// Response 201
{
  "cycle": {
    "id": "cycle-uuid",
    "name": "Inventário Q1 2025",
    "status": "SCHEDULED",
    ...
  }
}
```

#### POST /v1/inventory-cycles/{cycleId}/counts
```json
// Request
{
  "binId": "bin-uuid",
  "variantId": "variant-uuid",
  "countedQuantity": 45,
  "notes": "Contagem verificada 2x"
}

// Response 201
{
  "count": {
    "id": "count-uuid",
    "expectedQuantity": 50,
    "countedQuantity": 45,
    "discrepancy": -5,
    ...
  }
}
```

#### POST /v1/inventory-cycles/{cycleId}/reconcile
```json
// Request
{
  "discrepancyIds": ["disc-1", "disc-2"],
  "action": "ADJUST",  // ADJUST | IGNORE | REVIEW
  "notes": "Ajustado após verificação"
}

// Response 200
{
  "reconciled": 2,
  "adjustments": [
    {
      "itemId": "item-uuid",
      "previousQuantity": 50,
      "newQuantity": 45,
      "movementId": "mov-uuid"
    }
  ]
}
```

### 2.4 Regras de Negócio

1. **Criação de Ciclo**
   - Pode ser agendado para data futura
   - Define escopo (armazém, zonas, categorias)
   - Calcula automaticamente itens esperados

2. **Início de Contagem**
   - Snapshot do estoque atual
   - Status muda para `IN_PROGRESS`
   - Bloqueia movimentações nos itens do escopo (opcional)

3. **Registro de Contagens**
   - Cada bin/item pode ter múltiplas contagens
   - Discrepâncias são calculadas automaticamente
   - Permite anotações por contagem

4. **Reconciliação**
   - Gera movimentações de ajuste de estoque
   - Registra razão do ajuste
   - Atualiza quantities nas bins

5. **Finalização**
   - Todas discrepâncias devem estar resolvidas
   - Gera relatório final
   - Libera movimentações

### 2.5 Database Schema (Prisma)

```prisma
model InventoryCycle {
  id           String                @id @default(uuid())
  name         String
  description  String?
  status       InventoryCycleStatus  @default(SCHEDULED)
  type         InventoryCycleType

  warehouseId  String?
  warehouse    Warehouse?            @relation(fields: [warehouseId], references: [id])

  zoneIds      String[]
  categoryIds  String[]

  scheduledDate DateTime?
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt

  totalItems      Int               @default(0)
  countedItems    Int               @default(0)
  discrepancyCount Int              @default(0)

  createdBy    String
  startedBy    String?
  completedBy  String?

  counts        InventoryCount[]
  discrepancies InventoryDiscrepancy[]

  @@index([status])
  @@index([warehouseId])
  @@index([scheduledDate])
}

model InventoryCount {
  id              String          @id @default(uuid())
  cycleId         String
  cycle           InventoryCycle  @relation(fields: [cycleId], references: [id], onDelete: Cascade)

  binId           String
  bin             Bin             @relation(fields: [binId], references: [id])

  itemId          String?
  item            Item?           @relation(fields: [itemId], references: [id])

  variantId       String?
  variant         Variant?        @relation(fields: [variantId], references: [id])

  expectedQuantity Int
  countedQuantity  Int
  discrepancy      Int

  notes           String?
  countedAt       DateTime        @default(now())
  countedBy       String

  @@index([cycleId])
  @@index([binId])
  @@index([variantId])
}

model InventoryDiscrepancy {
  id              String              @id @default(uuid())
  countId         String
  count           InventoryCount      @relation(fields: [countId], references: [id])
  cycleId         String
  cycle           InventoryCycle      @relation(fields: [cycleId], references: [id])

  itemId          String?
  variantId       String?
  binId           String

  expectedQuantity Int
  countedQuantity  Int
  difference       Int

  status          DiscrepancyStatus   @default(PENDING)
  resolution      String?
  resolvedAt      DateTime?
  resolvedBy      String?

  @@index([cycleId])
  @@index([status])
}

enum InventoryCycleStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum InventoryCycleType {
  FULL
  PARTIAL
  CYCLE_COUNT
  SPOT_CHECK
}

enum DiscrepancyStatus {
  PENDING
  REVIEWED
  ADJUSTED
  IGNORED
}
```

---

## 3. Analytics de Estoque

Sistema de relatórios e análises de estoque.

### 3.1 Endpoints

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/v1/analytics/stock/overview` | Visão geral do estoque | `analytics:read` |
| `GET` | `/v1/analytics/stock/movements` | Análise de movimentações | `analytics:read` |
| `GET` | `/v1/analytics/stock/turnover` | Análise de giro de estoque | `analytics:read` |
| `GET` | `/v1/analytics/stock/aging` | Análise de aging/envelhecimento | `analytics:read` |
| `GET` | `/v1/analytics/stock/low-stock` | Itens com estoque baixo | `analytics:read` |
| `GET` | `/v1/analytics/stock/dead-stock` | Itens sem movimentação | `analytics:read` |
| `GET` | `/v1/analytics/stock/valuation` | Valorização do estoque | `analytics:read` |
| `GET` | `/v1/analytics/stock/by-category` | Estoque por categoria | `analytics:read` |
| `GET` | `/v1/analytics/stock/by-location` | Estoque por localização | `analytics:read` |
| `GET` | `/v1/analytics/stock/trends` | Tendências de estoque | `analytics:read` |
| `POST` | `/v1/analytics/reports/generate` | Gerar relatório customizado | `analytics:create` |
| `GET` | `/v1/analytics/reports` | Listar relatórios salvos | `analytics:read` |
| `GET` | `/v1/analytics/reports/{reportId}` | Obter relatório | `analytics:read` |
| `GET` | `/v1/analytics/reports/{reportId}/export` | Exportar relatório (CSV/PDF) | `analytics:read` |

### 3.2 Schemas

```typescript
interface StockOverview {
  totalItems: number;
  totalVariants: number;
  totalProducts: number;
  totalValue: number;

  byStatus: {
    available: number;
    reserved: number;
    inTransit: number;
    damaged: number;
  };

  recentMovements: {
    entries: number;
    exits: number;
    transfers: number;
  };

  alerts: {
    lowStock: number;
    outOfStock: number;
    overStock: number;
  };
}

interface StockMovementAnalysis {
  period: {
    from: Date;
    to: Date;
  };

  summary: {
    totalEntries: number;
    totalExits: number;
    netChange: number;
  };

  byType: {
    type: MovementType;
    count: number;
    quantity: number;
  }[];

  byDay: {
    date: string;
    entries: number;
    exits: number;
  }[];

  topProducts: {
    productId: string;
    productName: string;
    movements: number;
    quantity: number;
  }[];
}

interface StockTurnover {
  period: {
    from: Date;
    to: Date;
  };

  overallTurnover: number;
  averageDaysInStock: number;

  byCategory: {
    categoryId: string;
    categoryName: string;
    turnoverRate: number;
    averageDays: number;
  }[];

  byProduct: {
    productId: string;
    productName: string;
    turnoverRate: number;
    averageDays: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

interface StockAging {
  brackets: {
    label: string;         // "0-30 dias", "31-60 dias", etc.
    minDays: number;
    maxDays: number;
    itemCount: number;
    totalValue: number;
    percentage: number;
  }[];

  oldestItems: {
    itemId: string;
    productName: string;
    variantName: string;
    daysInStock: number;
    entryDate: Date;
    value: number;
  }[];
}

interface LowStockAlert {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  deficit: number;
  estimatedStockout?: Date;
}

interface StockValuation {
  totalValue: number;

  byMethod: {
    fifo: number;
    lifo: number;
    average: number;
  };

  byCategory: {
    categoryId: string;
    categoryName: string;
    value: number;
    percentage: number;
  }[];

  byWarehouse: {
    warehouseId: string;
    warehouseName: string;
    value: number;
    percentage: number;
  }[];

  trends: {
    date: string;
    value: number;
  }[];
}
```

### 3.3 Request/Response

#### GET /v1/analytics/stock/overview
```json
// Query Params
{
  "warehouseId": "wh-uuid",  // Opcional - filtrar por armazém
  "categoryId": "cat-uuid"   // Opcional - filtrar por categoria
}

// Response 200
{
  "overview": {
    "totalItems": 15234,
    "totalVariants": 523,
    "totalProducts": 156,
    "totalValue": 1523400.50,
    "byStatus": {
      "available": 14500,
      "reserved": 234,
      "inTransit": 450,
      "damaged": 50
    },
    "recentMovements": {
      "entries": 1250,
      "exits": 980,
      "transfers": 150
    },
    "alerts": {
      "lowStock": 23,
      "outOfStock": 5,
      "overStock": 12
    }
  },
  "generatedAt": "2025-01-15T10:00:00Z"
}
```

#### GET /v1/analytics/stock/trends
```json
// Query Params
{
  "period": "30d",           // 7d, 30d, 90d, 365d, custom
  "fromDate": "2024-12-01",  // Para período custom
  "toDate": "2025-01-15",    // Para período custom
  "granularity": "day",      // day, week, month
  "productId": "prod-uuid",  // Opcional
  "categoryId": "cat-uuid"   // Opcional
}

// Response 200
{
  "trends": {
    "period": { "from": "2024-12-15", "to": "2025-01-15" },
    "data": [
      { "date": "2024-12-15", "stock": 15000, "value": 1450000 },
      { "date": "2024-12-16", "stock": 15050, "value": 1455000 },
      ...
    ],
    "summary": {
      "stockChange": 234,
      "stockChangePercent": 1.5,
      "valueChange": 23400,
      "valueChangePercent": 1.6
    }
  }
}
```

### 3.4 Regras de Negócio

1. **Cache**
   - Relatórios pesados devem ser cacheados
   - TTL configurável por tipo de relatório
   - Invalidação ao ocorrer movimentações

2. **Agregações**
   - Usar materialized views para dados históricos
   - Processar em background para relatórios grandes
   - Suportar exportação assíncrona

3. **Permissões**
   - Dados sensíveis (valorização) requerem permissão especial
   - Filtrar por armazéns que o usuário tem acesso

---

## 4. Purchase Orders (Complementos)

Endpoints adicionais para ordens de compra.

### 4.1 Endpoints Faltantes

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `POST` | `/v1/purchase-orders/{orderId}/receive` | Receber ordem | `purchase-orders:receive` |
| `POST` | `/v1/purchase-orders/{orderId}/receive-partial` | Recebimento parcial | `purchase-orders:receive` |
| `GET` | `/v1/purchase-orders/{orderId}/items` | Listar itens da ordem | `purchase-orders:read` |
| `POST` | `/v1/purchase-orders/{orderId}/items` | Adicionar item | `purchase-orders:update` |
| `PATCH` | `/v1/purchase-orders/{orderId}/items/{itemId}` | Atualizar item | `purchase-orders:update` |
| `DELETE` | `/v1/purchase-orders/{orderId}/items/{itemId}` | Remover item | `purchase-orders:update` |
| `POST` | `/v1/purchase-orders/{orderId}/confirm` | Confirmar ordem | `purchase-orders:update` |
| `GET` | `/v1/purchase-orders/{orderId}/history` | Histórico de alterações | `purchase-orders:read` |

### 4.2 Schemas Adicionais

```typescript
interface PurchaseOrderReceive {
  items: {
    orderItemId: string;
    receivedQuantity: number;
    binId?: string;           // Localização de destino
    notes?: string;
    condition?: 'GOOD' | 'DAMAGED' | 'PARTIAL';
  }[];
  receivedDate: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  notes?: string;
}

interface PurchaseOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;

  // Populated
  variant?: Variant;
  product?: Product;
}
```

### 4.3 Request/Response

#### POST /v1/purchase-orders/{orderId}/receive
```json
// Request
{
  "items": [
    {
      "orderItemId": "poi-uuid-1",
      "receivedQuantity": 100,
      "binId": "bin-uuid",
      "condition": "GOOD"
    },
    {
      "orderItemId": "poi-uuid-2",
      "receivedQuantity": 45,
      "condition": "PARTIAL",
      "notes": "5 unidades danificadas"
    }
  ],
  "invoiceNumber": "NF-123456",
  "invoiceDate": "2025-01-15",
  "notes": "Recebido em boas condições"
}

// Response 200
{
  "order": {
    "id": "po-uuid",
    "status": "RECEIVED",  // ou PARTIALLY_RECEIVED
    ...
  },
  "itemsCreated": [
    {
      "itemId": "item-uuid-1",
      "uniqueCode": "ITM-001",
      "binId": "bin-uuid"
    },
    ...
  ],
  "movementIds": ["mov-uuid-1", "mov-uuid-2"]
}
```

---

## 5. Permissões Necessárias

### 5.1 Volumes
```json
{
  "module": "volumes",
  "permissions": [
    { "code": "volumes:read", "name": "Visualizar Volumes" },
    { "code": "volumes:create", "name": "Criar Volumes" },
    { "code": "volumes:update", "name": "Atualizar Volumes" },
    { "code": "volumes:delete", "name": "Deletar Volumes" }
  ]
}
```

### 5.2 Inventário
```json
{
  "module": "inventory",
  "permissions": [
    { "code": "inventory:read", "name": "Visualizar Inventário" },
    { "code": "inventory:create", "name": "Criar Ciclos de Inventário" },
    { "code": "inventory:update", "name": "Atualizar/Contar Inventário" },
    { "code": "inventory:delete", "name": "Deletar Ciclos" },
    { "code": "inventory:reconcile", "name": "Reconciliar Estoque" }
  ]
}
```

### 5.3 Analytics
```json
{
  "module": "analytics",
  "permissions": [
    { "code": "analytics:read", "name": "Visualizar Analytics" },
    { "code": "analytics:create", "name": "Criar Relatórios" },
    { "code": "analytics:export", "name": "Exportar Relatórios" },
    { "code": "analytics:valuation", "name": "Ver Valorização" }
  ]
}
```

### 5.4 Purchase Orders (Complemento)
```json
{
  "module": "purchase-orders",
  "permissions": [
    { "code": "purchase-orders:receive", "name": "Receber Ordens de Compra" }
  ]
}
```

---

## 6. Checklist de Implementação

### Volumes / Romaneio
- [ ] Criar models no Prisma (Volume, VolumeItem)
- [ ] Implementar CRUD de Volumes
- [ ] Implementar adição/remoção de itens
- [ ] Implementar fluxo de status (close, reopen, deliver, return)
- [ ] Implementar geração de romaneio
- [ ] Implementar geração de PDF
- [ ] Criar permissões no RBAC
- [ ] Criar testes

### Inventário
- [ ] Criar models no Prisma (InventoryCycle, InventoryCount, InventoryDiscrepancy)
- [ ] Implementar CRUD de ciclos
- [ ] Implementar registro de contagens
- [ ] Implementar cálculo de discrepâncias
- [ ] Implementar reconciliação
- [ ] Implementar geração de relatórios
- [ ] Criar permissões no RBAC
- [ ] Criar testes

### Analytics
- [ ] Definir queries otimizadas
- [ ] Criar materialized views para agregações
- [ ] Implementar endpoints de overview
- [ ] Implementar análise de movimentações
- [ ] Implementar análise de turnover
- [ ] Implementar análise de aging
- [ ] Implementar alertas de low stock
- [ ] Implementar valorização
- [ ] Implementar tendências
- [ ] Implementar sistema de cache
- [ ] Implementar exportação (CSV/PDF)
- [ ] Criar permissões no RBAC
- [ ] Criar testes

### Purchase Orders (Complemento)
- [ ] Implementar recebimento de ordens
- [ ] Implementar recebimento parcial
- [ ] Implementar criação automática de itens
- [ ] Implementar movimentações de entrada
- [ ] Atualizar status de ordem
- [ ] Criar permissão de receive
- [ ] Criar testes

---

## 7. Priorização Sugerida

1. **Alta Prioridade**
   - Volumes / Romaneio (core para expedição)
   - Purchase Orders Receive (core para entrada)

2. **Média Prioridade**
   - Inventário (importante para controle)
   - Analytics Overview (visibilidade)

3. **Baixa Prioridade**
   - Analytics avançados (tendências, aging)
   - Exportações PDF
