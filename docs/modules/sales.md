# Module: Sales

## Overview

O módulo **Sales** gerencia todo o ciclo de vida de vendas da plataforma OpenSea, cobrindo cinco subdomínios principais:

- **Customers** — cadastro e gerenciamento de clientes pessoa física (INDIVIDUAL) e pessoa jurídica (BUSINESS), com validação de CPF/CNPJ e unicidade por tenant.
- **Sales Orders** — criação e rastreamento de pedidos de venda com workflow de status e cálculo automático de totais.
- **Item Reservations** — reserva temporária de itens de estoque com controle de quantidade disponível e expiração automática.
- **Variant Promotions** — promoções por variante de produto com suporte a desconto percentual ou valor fixo em períodos delimitados.
- **Comments** — sistema de comentários hierárquico (threads) aplicável a entidades como clientes, produtos e pedidos.
- **Notification Preferences** — configuração de canais e tipos de alerta por usuário.

**Dependências de outros módulos:**

- `stock` — `Variant` e `Item` são referenciados por pedidos e reservas.
- `core` — `User` como autor de pedidos, reservas e comentários.
- `rbac` — verificação de permissões via `PermissionCodes.SALES.*`.
- `audit` — todas as operações de escrita registram entradas no log de auditoria via `logAudit`.

O módulo exige que o tenant tenha o módulo `SALES` habilitado no plano. A rota de `sales-orders` aplica `createModuleMiddleware('SALES')` via `onRequest` hook.

---

## Entities

### Customer

Representa um cliente do tenant, podendo ser pessoa física ou jurídica.

| Campo        | Tipo Prisma          | Obrigatório | Validação                                   | Descrição                              |
|--------------|----------------------|-------------|---------------------------------------------|----------------------------------------|
| `id`         | `String` (UUID)      | Sim         | Auto-gerado                                 | Identificador único                    |
| `name`       | `String` VarChar(128)| Sim         | 1–128 caracteres, trim                      | Nome completo ou razão social          |
| `type`       | `CustomerType` enum  | Sim         | `INDIVIDUAL` ou `BUSINESS`                  | Tipo do cliente                        |
| `document`   | `String?` VarChar(256)| Não        | CPF (11 dígitos) ou CNPJ (14 dígitos), com dígitos verificadores | Documento fiscal |
| `documentHash`| `String?`           | Não         | Blind index SHA-256                         | Hash para busca por unicidade          |
| `email`      | `String?` VarChar(512)| Não        | Formato RFC 5322, máx 254 chars, único por tenant | E-mail de contato               |
| `emailHash`  | `String?`            | Não         | Blind index SHA-256                         | Hash para busca por unicidade          |
| `phone`      | `String?` VarChar(256)| Não        | Máx 20 caracteres                           | Telefone de contato                    |
| `address`    | `String?` VarChar(512)| Não        | Máx 256 caracteres                          | Logradouro                             |
| `city`       | `String?` VarChar(128)| Não        | Máx 128 caracteres                          | Cidade                                 |
| `state`      | `String?` VarChar(2) | Não         | Exatamente 2 caracteres (UF), uppercase     | Estado                                 |
| `zipCode`    | `String?` VarChar(10)| Não        | Máx 10 caracteres                           | CEP                                    |
| `country`    | `String?` VarChar(64)| Não        | Máx 64 caracteres                           | País                                   |
| `notes`      | `String?` Text       | Não         | —                                           | Observações internas                   |
| `isActive`   | `Boolean`            | Sim         | Padrão `true`                               | Status de atividade                    |
| `tenantId`   | `String`             | Sim         | FK → `Tenant`                               | Isolamento multi-tenant                |
| `createdAt`  | `DateTime`           | Sim         | Auto-gerado                                 | Data de criação                        |
| `updatedAt`  | `DateTime`           | Sim         | Auto-atualizado                             | Data de atualização                    |
| `deletedAt`  | `DateTime?`          | Não         | Soft delete                                 | Data de exclusão lógica                |

**Relacionamentos:**
- `salesOrders SalesOrder[]` — pedidos de venda vinculados ao cliente.
- `tenant Tenant` — tenant proprietário do cadastro.

**Índices e Constraints:**
- `@@unique([documentHash, tenantId, deletedAt])` — impede duplicação de documento por tenant (soft-delete safe).
- `@@index([documentHash])`, `@@index([emailHash])`.

---

### SalesOrder

Representa um pedido de venda com itens, status e cálculo de totais.

| Campo         | Tipo Prisma            | Obrigatório | Validação                              | Descrição                          |
|---------------|------------------------|-------------|----------------------------------------|------------------------------------|
| `id`          | `String` (UUID)        | Sim         | Auto-gerado                            | Identificador único                |
| `orderNumber` | `String` VarChar(64)   | Sim         | 1–50 caracteres, único por tenant      | Número do pedido                   |
| `status`      | `OrderStatus` enum     | Sim         | Padrão `PENDING`; transições restritas | Status do workflow                 |
| `totalPrice`  | `Decimal(10,2)`        | Sim         | Calculado (soma dos itens)             | Preço bruto total                  |
| `discount`    | `Decimal(10,2)?`       | Não         | ≥ 0; padrão 0                          | Desconto global do pedido          |
| `finalPrice`  | `Decimal(10,2)`        | Sim         | `totalPrice - discount`                | Preço final                        |
| `notes`       | `String?` Text         | Não         | Máx 1.000 caracteres                   | Observações                        |
| `customerId`  | `String`               | Sim         | FK → `Customer`                        | Cliente do pedido                  |
| `createdBy`   | `String?`              | Não         | FK → `User`                            | Usuário que criou o pedido         |
| `tenantId`    | `String`               | Sim         | FK → `Tenant`                          | Isolamento multi-tenant            |
| `createdAt`   | `DateTime`             | Sim         | Auto-gerado                            | Data de criação                    |
| `updatedAt`   | `DateTime`             | Sim         | Auto-atualizado                        | Data de atualização                |
| `deletedAt`   | `DateTime?`            | Não         | Soft delete                            | Data de exclusão lógica            |

**Relacionamentos:**
- `items SalesOrderItem[]` — itens do pedido (cascade delete).
- `itemMovements ItemMovement[]` — movimentações de estoque geradas pelo pedido.
- `customer Customer` — cliente vinculado.
- `creator User?` — usuário que criou.

**Índices:** `customerId`, `status`, `orderNumber`, `createdBy`, `createdAt`, `tenantId`.

---

### SalesOrderItem

Representa um item dentro de um pedido de venda.

| Campo        | Tipo Prisma         | Obrigatório | Validação                            | Descrição                         |
|--------------|---------------------|-------------|--------------------------------------|-----------------------------------|
| `id`         | `String` (UUID)     | Sim         | Auto-gerado                          | Identificador único               |
| `orderId`    | `String`            | Sim         | FK → `SalesOrder` (cascade)          | Pedido pai                        |
| `variantId`  | `String`            | Sim         | FK → `Variant`; deve existir no tenant | Variante do produto              |
| `quantity`   | `Decimal(10,3)`     | Sim         | > 0; máx 10.000                      | Quantidade vendida                |
| `unitPrice`  | `Decimal(10,2)`     | Sim         | ≥ 0                                  | Preço unitário                    |
| `discount`   | `Decimal(10,2)?`    | Não         | ≥ 0; padrão 0                        | Desconto por item                 |
| `totalPrice` | `Decimal(10,2)`     | Sim         | `(unitPrice - discount) × quantity`  | Total do item                     |
| `notes`      | `String?` Text      | Não         | Máx 500 caracteres                   | Observações do item               |

---

### ItemReservation

Permite reservar uma quantidade de um item de estoque por um período determinado.

| Campo        | Tipo Prisma         | Obrigatório | Validação                              | Descrição                          |
|--------------|---------------------|-------------|----------------------------------------|------------------------------------|
| `id`         | `String` (UUID)     | Sim         | Auto-gerado                            | Identificador único                |
| `itemId`     | `String`            | Sim         | FK → `Item`; item deve existir         | Item reservado                     |
| `userId`     | `String`            | Sim         | FK → `User`                            | Usuário que criou a reserva        |
| `quantity`   | `Decimal(10,3)`     | Sim         | > 0; ≤ quantidade disponível           | Quantidade reservada               |
| `reason`     | `String?` VarChar(256)| Não       | —                                      | Motivo da reserva                  |
| `reference`  | `String?` VarChar(128)| Não       | —                                      | Referência externa (número do pedido, etc.) |
| `expiresAt`  | `DateTime`          | Sim         | > `now()`                              | Data/hora de expiração             |
| `releasedAt` | `DateTime?`         | Não         | Preenchido ao liberar                  | Data/hora de liberação manual      |
| `createdAt`  | `DateTime`          | Sim         | Auto-gerado                            | Data de criação                    |

**Índices:** `itemId`, `userId`, `expiresAt`, `(itemId, expiresAt)`.

---

### VariantPromotion

Define uma promoção de desconto para uma variante específica em um período.

| Campo          | Tipo Prisma           | Obrigatório | Validação                                     | Descrição                       |
|----------------|-----------------------|-------------|-----------------------------------------------|---------------------------------|
| `id`           | `String` (UUID)       | Sim         | Auto-gerado                                   | Identificador único             |
| `variantId`    | `String`              | Sim         | FK → `Variant` (cascade delete)               | Variante promocionada           |
| `name`         | `String` VarChar(128) | Sim         | 1–100 caracteres, trim                        | Nome da promoção                |
| `discountType` | `DiscountType` enum   | Sim         | `PERCENTAGE` ou `FIXED_AMOUNT`                | Tipo de desconto                |
| `discountValue`| `Decimal(10,2)`       | Sim         | ≥ 0; se `PERCENTAGE`, ≤ 100                   | Valor do desconto               |
| `startDate`    | `DateTime`            | Sim         | < `endDate`                                   | Início da vigência              |
| `endDate`      | `DateTime`            | Sim         | > `startDate`                                 | Fim da vigência                 |
| `isActive`     | `Boolean`             | Sim         | Padrão `true`                                 | Promoção ativa                  |
| `notes`        | `String?` Text        | Não         | —                                             | Observações                     |
| `createdAt`    | `DateTime`            | Sim         | Auto-gerado                                   | Data de criação                 |
| `updatedAt`    | `DateTime`            | Sim         | Auto-atualizado                               | Data de atualização             |
| `deletedAt`    | `DateTime?`           | Não         | Soft delete                                   | Data de exclusão lógica         |

**Índices:** `variantId`, `isActive`, `(startDate, endDate)`, `(variantId, startDate, endDate)`.

---

### Comment

Sistema de comentários hierárquico aplicável a múltiplos tipos de entidade.

| Campo            | Tipo Prisma         | Obrigatório | Validação                                      | Descrição                          |
|------------------|---------------------|-------------|------------------------------------------------|------------------------------------|
| `id`             | `String` (UUID)     | Sim         | Auto-gerado                                    | Identificador único                |
| `entityType`     | `String` VarChar(32)| Sim         | Um de: `CUSTOMER`, `PRODUCT`, `SALES_ORDER`    | Tipo da entidade comentada         |
| `entityId`       | `String` VarChar(36)| Sim         | UUID da entidade                               | ID da entidade comentada           |
| `content`        | `String` Text       | Sim         | 1–5.000 caracteres, trim                       | Conteúdo do comentário             |
| `parentCommentId`| `String?`           | Não         | FK → `Comment` (cascade); mesma entidade       | ID do comentário pai (para reply)  |
| `userId`         | `String`            | Sim         | FK → `User`                                    | Autor do comentário                |
| `createdAt`      | `DateTime`          | Sim         | Auto-gerado                                    | Data de criação                    |
| `updatedAt`      | `DateTime`          | Sim         | Auto-atualizado                                | Data de atualização                |
| `deletedAt`      | `DateTime?`         | Não         | Soft delete                                    | Data de exclusão lógica            |

**Relacionamentos:**
- `parent Comment?` / `replies Comment[]` — auto-referência para threads.

**Índices:** `userId`, `(entityType, entityId)`, `parentCommentId`, `createdAt`.

---

### NotificationPreference

Configura quais tipos de alerta o usuário deseja receber e por qual canal.

| Campo       | Tipo Prisma              | Obrigatório | Validação                                                | Descrição              |
|-------------|--------------------------|-------------|----------------------------------------------------------|------------------------|
| `id`        | `String` (UUID)          | Sim         | Auto-gerado                                              | Identificador único    |
| `userId`    | `String`                 | Sim         | FK → `User`                                              | Usuário proprietário   |
| `alertType` | `AlertType` enum         | Sim         | `LOW_STOCK`, `OUT_OF_STOCK`, `EXPIRING_SOON`, `EXPIRED`, `PRICE_CHANGE`, `REORDER_POINT` | Tipo do alerta |
| `channel`   | `NotificationChannel` enum| Sim        | `IN_APP`, `EMAIL`, `SMS`, `PUSH`                         | Canal de notificação   |
| `isEnabled` | `Boolean`                | Sim         | Padrão `true`                                            | Preferência habilitada |
| `createdAt` | `DateTime`               | Sim         | Auto-gerado                                              | Data de criação        |
| `updatedAt` | `DateTime`               | Sim         | Auto-atualizado                                          | Data de atualização    |
| `deletedAt` | `DateTime?`              | Não         | Soft delete                                              | Data de exclusão lógica|

**Constraint:** `@@unique([userId, alertType, channel])` — um usuário não pode ter duas preferências com o mesmo tipo e canal.

---

## Value Objects

### `CustomerType`

Encapsula o tipo de cliente com fábrica estática e guards de tipo:

```typescript
// Valores aceitos (case-insensitive na criação)
CustomerType.INDIVIDUAL()  // pessoa física
CustomerType.BUSINESS()    // pessoa jurídica

// Guard properties
customerType.isIndividual  // boolean
customerType.isBusiness    // boolean
```

### `OrderStatus`

Encapsula o status do pedido e expõe predicados de transição:

```typescript
OrderStatus.DRAFT()      // rascunho
OrderStatus.PENDING()    // aguardando confirmação (padrão na criação)
OrderStatus.CONFIRMED()  // confirmado
OrderStatus.IN_TRANSIT() // em trânsito
OrderStatus.DELIVERED()  // entregue
OrderStatus.CANCELLED()  // cancelado
OrderStatus.RETURNED()   // devolvido

status.canBeModified  // true se DRAFT ou PENDING
status.isFinal        // true se DELIVERED, CANCELLED ou RETURNED
```

### `DiscountType`

```typescript
DiscountType.PERCENTAGE()   // desconto em percentual (0–100)
DiscountType.FIXED_AMOUNT() // desconto em valor monetário fixo
```

### `Document`

Valida e formata CPF (11 dígitos) ou CNPJ (14 dígitos):

```typescript
// Remove caracteres não numéricos antes de validar
const doc = Document.create('123.456.789-09')
doc.isCPF      // true
doc.isCNPJ     // false
doc.formatted  // "123.456.789-09" ou "00.000.000/0000-00"
doc.value      // somente dígitos: "12345678909"
```

A validação implementa o algoritmo completo de dígitos verificadores para CPF e CNPJ, rejeitando sequências repetidas (ex.: `111.111.111-11`).

### `EntityType`

Identifica o tipo da entidade alvo de um comentário:

```
PRODUCT | VARIANT | ITEM | CUSTOMER | SUPPLIER | MANUFACTURER | SALES_ORDER | PURCHASE_ORDER | OTHER
```

Nota: o `CreateCommentUseCase` aceita apenas `CUSTOMER`, `PRODUCT` e `SALES_ORDER` como valores válidos no momento.

---

## Endpoints

### Customers

| Método   | Path                   | Permissão                    | Descrição                            |
|----------|------------------------|------------------------------|--------------------------------------|
| `POST`   | `/v1/customers`        | `sales.customers.create`     | Cria um novo cliente                 |
| `GET`    | `/v1/customers`        | — (verifyJwt + verifyTenant) | Lista clientes com paginação         |
| `GET`    | `/v1/customers/:id`    | `sales.customers.read`       | Retorna cliente por ID               |
| `PATCH`  | `/v1/customers/:id`    | `sales.customers.update`     | Atualiza dados do cliente            |
| `DELETE` | `/v1/customers/:id`    | `sales.customers.delete`     | Remove cliente (soft delete)         |

### Sales Orders

| Método   | Path                             | Permissão                | Descrição                                  |
|----------|----------------------------------|--------------------------|--------------------------------------------|
| `POST`   | `/v1/sales-orders`               | `sales.orders.create`    | Cria um novo pedido de venda               |
| `GET`    | `/v1/sales-orders`               | `sales.orders.list`      | Lista pedidos com paginação                |
| `GET`    | `/v1/sales-orders/:id`           | `sales.orders.read`      | Retorna pedido por ID                      |
| `PATCH`  | `/v1/sales-orders/:id/status`    | `sales.orders.update`    | Atualiza status do pedido                  |
| `DELETE` | `/v1/sales-orders/:id`           | `sales.orders.cancel`    | Cancela o pedido                           |

> Todas as rotas de `sales-orders` aplicam `createModuleMiddleware('SALES')` — o tenant precisa ter o módulo `SALES` habilitado no plano.

### Item Reservations

| Método   | Path                              | Permissão                     | Descrição                                 |
|----------|-----------------------------------|-------------------------------|-------------------------------------------|
| `POST`   | `/v1/item-reservations`           | — (verifyJwt)                 | Cria uma reserva de item                  |
| `GET`    | `/v1/item-reservations`           | `sales.reservations.list`     | Lista reservas                            |
| `GET`    | `/v1/item-reservations/:id`       | `sales.reservations.read`     | Retorna reserva por ID                    |
| `POST`   | `/v1/item-reservations/:id/release` | `sales.reservations.release` | Libera uma reserva ativa                  |

### Variant Promotions

| Método   | Path                         | Permissão                  | Descrição                               |
|----------|------------------------------|----------------------------|-----------------------------------------|
| `POST`   | `/v1/variant-promotions`     | `sales.promotions.create`  | Cria promoção para uma variante         |
| `GET`    | `/v1/variant-promotions`     | `sales.promotions.list`    | Lista promoções                         |
| `GET`    | `/v1/variant-promotions/:id` | `sales.promotions.read`    | Retorna promoção por ID                 |
| `PATCH`  | `/v1/variant-promotions/:id` | `sales.promotions.update`  | Atualiza promoção                       |
| `DELETE` | `/v1/variant-promotions/:id` | `sales.promotions.delete`  | Remove promoção (soft delete)           |

### Comments

| Método   | Path                  | Permissão               | Descrição                              |
|----------|-----------------------|-------------------------|----------------------------------------|
| `POST`   | `/v1/comments`        | `sales.comments.create` | Cria comentário ou reply               |
| `GET`    | `/v1/comments`        | `sales.comments.list`   | Lista comentários de uma entidade      |
| `GET`    | `/v1/comments/:id`    | `sales.comments.read`   | Retorna comentário por ID              |
| `PATCH`  | `/v1/comments/:id`    | `sales.comments.update` | Edita conteúdo do comentário           |
| `DELETE` | `/v1/comments/:id`    | `sales.comments.delete` | Remove comentário (soft delete)        |

### Notification Preferences

| Método   | Path                                | Permissão   | Descrição                                        |
|----------|-------------------------------------|-------------|--------------------------------------------------|
| `POST`   | `/v1/notification-preferences`      | verifyJwt   | Cria preferência de notificação                  |
| `GET`    | `/v1/notification-preferences`      | verifyJwt   | Lista preferências do usuário autenticado        |
| `PATCH`  | `/v1/notification-preferences/:id`  | verifyJwt   | Atualiza preferência (habilita/desabilita)       |
| `DELETE` | `/v1/notification-preferences/:id`  | verifyJwt   | Remove preferência                               |

> Nota: o submódulo de preferências de notificação também é exposto sob `/v1/me/notification-preferences` (perfil do usuário logado) via controllers em `core/me/`.

---

## Request/Response Examples

### POST `/v1/customers`

**Request body:**
```json
{
  "name": "Empresa Exemplo Ltda",
  "type": "BUSINESS",
  "document": "11.222.333/0001-81",
  "email": "contato@empresa.com.br",
  "phone": "(11) 98765-4321",
  "address": "Rua das Flores, 100",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01310-100",
  "country": "Brasil",
  "notes": "Cliente preferencial desde 2023"
}
```

**Response 201:**
```json
{
  "customer": {
    "id": "a1b2c3d4-...",
    "name": "Empresa Exemplo Ltda",
    "type": "BUSINESS",
    "document": "11222333000181",
    "email": "contato@empresa.com.br",
    "phone": "(11) 98765-4321",
    "address": "Rua das Flores, 100",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100",
    "country": "Brasil",
    "isActive": true,
    "createdAt": "2026-03-10T14:00:00.000Z"
  }
}
```

### POST `/v1/sales-orders`

**Request body:**
```json
{
  "orderNumber": "PED-2026-0001",
  "customerId": "a1b2c3d4-...",
  "status": "PENDING",
  "discount": 50.00,
  "notes": "Entrega expressa solicitada",
  "items": [
    {
      "variantId": "e5f6g7h8-...",
      "quantity": 2,
      "unitPrice": 299.90,
      "discount": 0,
      "notes": "Cor azul"
    }
  ]
}
```

**Response 201:**
```json
{
  "salesOrder": {
    "id": "x1y2z3w4-...",
    "orderNumber": "PED-2026-0001",
    "status": "PENDING",
    "customerId": "a1b2c3d4-...",
    "createdBy": "u9v8w7x6-...",
    "totalPrice": 599.80,
    "discount": 50.00,
    "finalPrice": 549.80,
    "notes": "Entrega expressa solicitada",
    "items": [
      {
        "id": "i1j2k3l4-...",
        "variantId": "e5f6g7h8-...",
        "quantity": 2,
        "unitPrice": 299.90,
        "discount": 0,
        "totalPrice": 599.80,
        "notes": "Cor azul"
      }
    ],
    "createdAt": "2026-03-10T14:05:00.000Z",
    "updatedAt": "2026-03-10T14:05:00.000Z"
  }
}
```

### POST `/v1/item-reservations`

**Request body:**
```json
{
  "itemId": "i9k8l7m6-...",
  "quantity": 5,
  "reason": "Separado para cliente VIP",
  "reference": "PED-2026-0001",
  "expiresAt": "2026-03-17T23:59:59.000Z"
}
```

### POST `/v1/variant-promotions`

**Request body:**
```json
{
  "variantId": "e5f6g7h8-...",
  "name": "Liquidação de Inverno",
  "discountType": "PERCENTAGE",
  "discountValue": 25,
  "startDate": "2026-06-21T00:00:00.000Z",
  "endDate": "2026-07-31T23:59:59.000Z",
  "isActive": true,
  "notes": "Válido para estoque atual"
}
```

---

## Business Rules

### Regra 1: Unicidade de documento e e-mail por tenant

O documento (CPF/CNPJ) e o e-mail de cada cliente são únicos dentro do tenant, verificados via blind index hash. A unicidade respeita soft delete — um documento pode ser reutilizado após a exclusão do cliente original.

- **Condição:** `findByDocument(document, tenantId)` ou `findByEmail(email, tenantId)` retorna registro ativo.
- **Consequência:** `BadRequestError` com mensagem `'Document already in use by another customer.'` ou `'Email already in use by another customer.'`.

### Regra 2: Validação completa de CPF e CNPJ

O Value Object `Document` implementa o algoritmo completo de dígitos verificadores, rejeitando:
- Documentos com todos os dígitos iguais (ex.: `000.000.000-00`).
- CPF ou CNPJ com dígitos verificadores incorretos.
- Strings com comprimento diferente de 11 (CPF) ou 14 (CNPJ) dígitos numéricos.

Máscaras de formatação (pontos, barras, hífens) são removidas antes da validação.

### Regra 3: Unicidade do número do pedido por tenant

O campo `orderNumber` deve ser único dentro do tenant (constraint `@@unique([orderNumber, tenantId, deletedAt])`). O use case verifica a existência antes da criação.

- **Consequência:** `BadRequestError('Order number already exists.')`.

### Regra 4: Pedido deve ter ao menos um item

```typescript
if (!input.items || input.items.length === 0) {
  throw new BadRequestError('Order must have at least one item.')
}
// Máximo de 100 itens por pedido
if (input.items.length > 100) { ... }
```

### Regra 5: Variantes e clientes devem pertencer ao mesmo tenant

Ao criar um pedido, o use case verifica individualmente cada `variantId` via `VariantsRepository.findById(id, tenantId)` e verifica o `customerId` via `CustomersRepository.findById(id, tenantId)`. Um ID válido de outro tenant resulta em `ResourceNotFoundError`.

### Regra 6: Máquina de estados do pedido

Transições permitidas e bloqueadas (verificadas em `UpdateSalesOrderStatusUseCase`):

```
DRAFT     → PENDING    ✅
DRAFT     → CONFIRMED  ✅
DRAFT     → IN_TRANSIT ❌ (proibido)
DRAFT     → DELIVERED  ❌ (proibido)
DRAFT     → CANCELLED  ✅
PENDING   → CONFIRMED  ✅
PENDING   → IN_TRANSIT ❌ (deve confirmar antes)
PENDING   → DELIVERED  ❌ (deve confirmar antes)
PENDING   → CANCELLED  ✅
CONFIRMED → IN_TRANSIT ✅
CONFIRMED → CANCELLED  ✅
IN_TRANSIT→ DELIVERED  ✅
IN_TRANSIT→ RETURNED   ✅
DELIVERED → *          ❌ (status final — imutável)
CANCELLED → *          ❌ (status final — imutável)
RETURNED  → *          ❌ (status final — imutável)
```

`OrderStatus.isFinal` (`DELIVERED | CANCELLED | RETURNED`) bloqueia qualquer transição.

### Regra 7: Cancelamento de pedido

O endpoint `DELETE /v1/sales-orders/:id` delega para `CancelSalesOrderUseCase`, que chama `order.cancel()` na entidade e persiste via `save()`. Um pedido em status final não pode ser cancelado.

### Regra 8: Controle de quantidade disponível em reservas

Ao criar uma reserva, o use case soma todas as reservas ativas do item (`findManyActive`) e subtrai do `currentQuantity` do item. Se a quantidade solicitada exceder o disponível, lança `BadRequestError` informando os valores.

```typescript
const availableQuantity = item.currentQuantity - reservedQuantity
if (quantity > availableQuantity) {
  throw new BadRequestError(
    `Insufficient available quantity. Available: ${availableQuantity}, Requested: ${quantity}`
  )
}
```

### Regra 9: Reserva não pode ser liberada duas vezes

```typescript
if (reservation.isReleased) {
  throw new BadRequestError('Reservation already released')
}
```

### Regra 10: Desconto percentual não pode exceder 100%

```typescript
if (discountType === 'PERCENTAGE' && discountValue > 100) {
  throw new BadRequestError('Percentage discount cannot exceed 100%')
}
```

### Regra 11: Comentários de reply devem referenciar a mesma entidade

Ao criar um reply (com `parentCommentId`), o sistema valida que o comentário pai pertence à mesma `entityType` e `entityId`. Comentários de entidades diferentes não podem ser encadeados.

### Regra 12: Unicidade de preferência de notificação

Cada combinação `(userId, alertType, channel)` é única no banco (`@@unique`). A tentativa de criar uma preferência duplicada resulta em erro de constraint do banco.

---

## Order Workflow (State Machine)

```
        ┌─────────────┐
        │    DRAFT    │──────────────────────────────┐
        └──────┬──────┘                              │
               │ confirm                             │ cancel
               ▼                                     ▼
        ┌─────────────┐                    ┌──────────────────┐
        │   PENDING   │────────────────────│    CANCELLED     │
        └──────┬──────┘     cancel         │   (FINAL)        │
               │ confirm                  └──────────────────┘
               ▼
        ┌─────────────┐
        │  CONFIRMED  │──────────────────────────────┐
        └──────┬──────┘                              │ cancel
               │ dispatch                            ▼
               ▼                          ┌──────────────────┐
        ┌─────────────┐                   │    CANCELLED     │
        │  IN_TRANSIT │                   │   (FINAL)        │
        └──────┬──────┘                   └──────────────────┘
               │ deliver
               ▼
        ┌─────────────┐
        │  DELIVERED  │  (FINAL)
        └─────────────┘
               │ (alternativamente)
               │ return
               ▼
        ┌─────────────┐
        │  RETURNED   │  (FINAL)
        └─────────────┘
```

**Status padrão na criação:** `PENDING` (pode ser sobrescrito para `DRAFT` ou `CONFIRMED` via campo opcional `status`).

---

## Permissions

| Código                         | Descrição                                  | Recurso               |
|-------------------------------|--------------------------------------------|-----------------------|
| `sales.customers.create`      | Criar clientes                             | Customers             |
| `sales.customers.read`        | Visualizar detalhes de clientes            | Customers             |
| `sales.customers.update`      | Atualizar dados de clientes                | Customers             |
| `sales.customers.delete`      | Remover clientes                           | Customers             |
| `sales.customers.list`        | Listar clientes                            | Customers             |
| `sales.customers.manage`      | Gerenciamento completo de clientes         | Customers             |
| `sales.orders.create`         | Criar pedidos de venda                     | Sales Orders          |
| `sales.orders.read`           | Visualizar pedidos                         | Sales Orders          |
| `sales.orders.update`         | Atualizar status de pedidos                | Sales Orders          |
| `sales.orders.delete`         | Excluir pedidos                            | Sales Orders          |
| `sales.orders.list`           | Listar pedidos                             | Sales Orders          |
| `sales.orders.cancel`         | Cancelar pedidos                           | Sales Orders          |
| `sales.orders.approve`        | Aprovar pedidos                            | Sales Orders          |
| `sales.orders.manage`         | Gerenciamento completo de pedidos          | Sales Orders          |
| `sales.promotions.create`     | Criar promoções de variante                | Variant Promotions    |
| `sales.promotions.read`       | Visualizar promoções                       | Variant Promotions    |
| `sales.promotions.update`     | Atualizar promoções                        | Variant Promotions    |
| `sales.promotions.delete`     | Remover promoções                          | Variant Promotions    |
| `sales.promotions.list`       | Listar promoções                           | Variant Promotions    |
| `sales.promotions.manage`     | Gerenciamento completo de promoções        | Variant Promotions    |
| `sales.reservations.create`   | Criar reservas de itens                    | Item Reservations     |
| `sales.reservations.read`     | Visualizar reservas                        | Item Reservations     |
| `sales.reservations.update`   | Atualizar reservas                         | Item Reservations     |
| `sales.reservations.delete`   | Remover reservas                           | Item Reservations     |
| `sales.reservations.list`     | Listar reservas                            | Item Reservations     |
| `sales.reservations.release`  | Liberar reservas ativas                    | Item Reservations     |
| `sales.reservations.manage`   | Gerenciamento completo de reservas         | Item Reservations     |
| `sales.comments.create`       | Criar comentários                          | Comments              |
| `sales.comments.read`         | Visualizar comentários                     | Comments              |
| `sales.comments.update`       | Editar comentários                         | Comments              |
| `sales.comments.delete`       | Remover comentários                        | Comments              |
| `sales.comments.list`         | Listar comentários                         | Comments              |

**Observações sobre permissões:**
- A criação de reservas (`POST /v1/item-reservations`) requer apenas `verifyJwt` — sem verificação de permissão RBAC específica (qualquer usuário autenticado com tenant pode reservar).
- Preferências de notificação não possuem permissões RBAC — são controladas apenas por `verifyJwt`.
- Reportes de vendas (`reports.sales.*`) existem no `permission-codes.ts` mas são tratados em módulo separado de relatórios.

---

## Data Model

```prisma
// Enums do módulo Sales
enum CustomerType {
  INDIVIDUAL
  BUSINESS
}

enum OrderStatus {
  DRAFT
  PENDING
  CONFIRMED
  IN_TRANSIT
  DELIVERED
  CANCELLED
  RETURNED
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum AlertType {
  LOW_STOCK
  OUT_OF_STOCK
  EXPIRING_SOON
  EXPIRED
  PRICE_CHANGE
  REORDER_POINT
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
  PUSH
}

model Customer {
  id           String       @id @default(uuid())
  name         String       @db.VarChar(128)
  type         CustomerType @default(INDIVIDUAL)
  document     String?      @db.VarChar(256)
  documentHash String?      @map("document_hash") @db.VarChar(64)
  email        String?      @db.VarChar(512)
  emailHash    String?      @map("email_hash") @db.VarChar(64)
  phone        String?      @db.VarChar(256)
  address      String?      @db.VarChar(512)
  city         String?      @db.VarChar(128)
  state        String?      @db.VarChar(2)
  zipCode      String?      @map("zip_code") @db.VarChar(10)
  country      String?      @db.VarChar(64)
  notes        String?      @db.Text
  isActive     Boolean      @default(true) @map("is_active")
  tenantId     String       @map("tenant_id")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  deletedAt    DateTime?    @map("deleted_at")

  @@unique([documentHash, tenantId, deletedAt], name: "customers_document_unique_active")
  @@index([documentHash])
  @@index([emailHash])
  @@map("customers")
}

model SalesOrder {
  id          String      @id @default(uuid())
  orderNumber String      @map("order_number") @db.VarChar(64)
  status      OrderStatus @default(PENDING)
  totalPrice  Decimal     @map("total_price") @db.Decimal(10, 2)
  discount    Decimal?    @default(0) @db.Decimal(10, 2)
  finalPrice  Decimal     @map("final_price") @db.Decimal(10, 2)
  notes       String?     @db.Text
  customerId  String      @map("customer_id")
  createdBy   String?     @map("created_by")
  tenantId    String      @map("tenant_id")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  deletedAt   DateTime?   @map("deleted_at")

  @@unique([orderNumber, tenantId, deletedAt], name: "sales_orders_order_number_unique_active")
  @@index([customerId])
  @@index([status])
  @@index([orderNumber])
  @@index([createdAt])
  @@map("sales_orders")
}

model SalesOrderItem {
  id         String   @id @default(uuid())
  orderId    String   @map("order_id")
  variantId  String   @map("variant_id")
  quantity   Decimal  @db.Decimal(10, 3)
  unitPrice  Decimal  @map("unit_price") @db.Decimal(10, 2)
  discount   Decimal? @default(0) @db.Decimal(10, 2)
  totalPrice Decimal  @map("total_price") @db.Decimal(10, 2)
  notes      String?  @db.Text
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([orderId])
  @@index([variantId])
  @@map("sales_order_items")
}

model ItemReservation {
  id         String    @id @default(uuid())
  itemId     String    @map("item_id")
  userId     String    @map("user_id")
  quantity   Decimal   @db.Decimal(10, 3)
  reason     String?   @db.VarChar(256)
  reference  String?   @db.VarChar(128)
  expiresAt  DateTime  @map("expires_at")
  releasedAt DateTime? @map("released_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  @@index([itemId])
  @@index([userId])
  @@index([expiresAt])
  @@index([itemId, expiresAt])
  @@map("item_reservations")
}

model VariantPromotion {
  id            String       @id @default(uuid())
  variantId     String       @map("variant_id")
  name          String       @db.VarChar(128)
  discountType  DiscountType @map("discount_type")
  discountValue Decimal      @map("discount_value") @db.Decimal(10, 2)
  startDate     DateTime     @map("start_date")
  endDate       DateTime     @map("end_date")
  isActive      Boolean      @default(true) @map("is_active")
  notes         String?      @db.Text
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  deletedAt     DateTime?    @map("deleted_at")

  @@index([variantId])
  @@index([isActive])
  @@index([startDate, endDate])
  @@index([variantId, startDate, endDate])
  @@map("variant_promotions")
}

model Comment {
  id              String    @id @default(uuid())
  entityType      String    @db.VarChar(32)
  entityId        String    @db.VarChar(36)
  content         String    @db.Text
  parentCommentId String?   @map("parent_comment_id")
  userId          String    @map("user_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  @@index([userId])
  @@index([entityType, entityId])
  @@index([parentCommentId])
  @@index([createdAt])
  @@map("comments")
}

model NotificationPreference {
  id        String              @id @default(uuid())
  userId    String              @map("user_id")
  alertType AlertType           @map("alert_type")
  channel   NotificationChannel
  isEnabled Boolean             @default(true) @map("is_enabled")
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")
  deletedAt DateTime?           @map("deleted_at")

  @@unique([userId, alertType, channel])
  @@index([userId])
  @@index([alertType])
  @@map("notification_preferences")
}
```

---

## Use Cases

### Customers

| Use Case                  | Arquivo                            | Descrição                                         |
|---------------------------|-------------------------------------|---------------------------------------------------|
| `CreateCustomerUseCase`   | `customers/create-customer.ts`      | Cria cliente com validação de documento e e-mail  |
| `UpdateCustomerUseCase`   | `customers/update-customer.ts`      | Atualiza dados do cliente                         |
| `DeleteCustomerUseCase`   | `customers/delete-customer.ts`      | Soft delete do cliente                            |
| `GetCustomerByIdUseCase`  | `customers/get-customer-by-id.ts`   | Busca cliente por ID e tenantId                   |
| `ListCustomersUseCase`    | `customers/list-customers.ts`       | Lista paginada com filtros por tipo e status      |

### Sales Orders

| Use Case                        | Arquivo                                  | Descrição                                            |
|---------------------------------|------------------------------------------|------------------------------------------------------|
| `CreateSalesOrderUseCase`       | `sales-orders/create-sales-order.ts`     | Cria pedido, valida cliente e variantes              |
| `UpdateSalesOrderStatusUseCase` | `sales-orders/update-sales-order-status.ts` | Atualiza status com validação de transições       |
| `CancelSalesOrderUseCase`       | `sales-orders/cancel-sales-order.ts`     | Cancela pedido não-final                             |
| `GetSalesOrderByIdUseCase`      | `sales-orders/get-sales-order-by-id.ts`  | Busca pedido por ID e tenantId                       |
| `ListSalesOrdersUseCase`        | `sales-orders/list-sales-orders.ts`      | Lista paginada de pedidos                            |

### Item Reservations

| Use Case                       | Arquivo                                       | Descrição                                          |
|--------------------------------|-----------------------------------------------|----------------------------------------------------|
| `CreateItemReservationUseCase` | `item-reservations/create-item-reservation.ts`| Reserva quantidade verificando disponibilidade     |
| `ReleaseItemReservationUseCase`| `item-reservations/release-item-reservation.ts`| Libera reserva ativa                              |
| `GetItemReservationByIdUseCase`| `item-reservations/get-item-reservation-by-id.ts` | Busca reserva por ID                          |
| `ListItemReservationsUseCase`  | `item-reservations/list-item-reservations.ts` | Lista reservas com filtros                         |

### Variant Promotions

| Use Case                       | Arquivo                                            | Descrição                                     |
|--------------------------------|----------------------------------------------------|-----------------------------------------------|
| `CreateVariantPromotionUseCase`| `variant-promotions/create-variant-promotion.ts`  | Cria promoção com validação de datas e desconto|
| `UpdateVariantPromotionUseCase`| `variant-promotions/update-variant-promotion.ts`  | Atualiza promoção existente                   |
| `DeleteVariantPromotionUseCase`| `variant-promotions/delete-variant-promotion.ts`  | Soft delete da promoção                       |
| `GetVariantPromotionByIdUseCase`| `variant-promotions/get-variant-promotion-by-id.ts` | Busca promoção por ID                      |
| `ListVariantPromotionsUseCase` | `variant-promotions/list-variant-promotions.ts`   | Lista promoções com filtros                   |

### Comments

| Use Case                 | Arquivo                          | Descrição                                            |
|--------------------------|----------------------------------|------------------------------------------------------|
| `CreateCommentUseCase`   | `comments/create-comment.ts`     | Cria comentário ou reply; valida entidade e pai      |
| `UpdateCommentUseCase`   | `comments/update-comment.ts`     | Edita conteúdo do comentário                         |
| `DeleteCommentUseCase`   | `comments/delete-comment.ts`     | Soft delete do comentário                            |
| `GetCommentByIdUseCase`  | `comments/get-comment-by-id.ts`  | Busca comentário por ID                              |
| `ListCommentsUseCase`    | `comments/list-comments.ts`      | Lista comentários de uma entidade                    |

### Notification Preferences

| Use Case                                  | Arquivo                                                    | Descrição                                 |
|-------------------------------------------|------------------------------------------------------------|-------------------------------------------|
| `CreateNotificationPreferenceUseCase`     | `notification-preferences/create-notification-preference.ts` | Cria preferência com validação de enum  |
| `UpdateNotificationPreferenceUseCase`     | `notification-preferences/update-notification-preference.ts` | Atualiza `isEnabled`                    |
| `DeleteNotificationPreferenceUseCase`     | `notification-preferences/delete-notification-preference.ts` | Remove preferência                      |
| `GetNotificationPreferenceUseCase`        | `notification-preferences/get-notification-preference.ts`    | Busca preferência por ID                |
| `ListNotificationPreferencesByUserUseCase`| `notification-preferences/list-notification-preferences-by-user.ts` | Lista preferências do usuário |

---

## Tests

### Unit Tests (`.spec.ts`)

| Subdomínio              | Arquivos de teste | Casos cobertos                                                     |
|-------------------------|-------------------|--------------------------------------------------------------------|
| Customers               | 5 arquivos        | Criação com/sem documento, validação CPF/CNPJ, duplicidade, update, delete, list, get |
| Sales Orders            | 5 arquivos        | Criação, transições de status válidas e inválidas, cancelamento, cliente não encontrado, variante não encontrada |
| Item Reservations       | 4 arquivos        | Criação com quantidade disponível, insuficiência, expiração inválida, liberação, liberação dupla |
| Variant Promotions      | 5 arquivos        | Criação com PERCENTAGE/FIXED_AMOUNT, datas inválidas, variante não encontrada, update, delete, list |
| Comments                | 5 arquivos        | Criação de comentário raiz, reply válido, reply em entidade diferente, conteúdo vazio, update, delete |
| Notification Preferences| 5 arquivos        | Criação com tipos e canais válidos, inválidos, list por usuário, update, delete |

### E2E Tests (`.e2e.spec.ts`)

Os testes E2E do módulo de sales-orders estão em `src/http/controllers/sales/sales-orders/`:

| Arquivo                                    | Cenários cobertos                                                  |
|--------------------------------------------|--------------------------------------------------------------------|
| `v1-create-sales-order.e2e.spec.ts`        | Criação com sucesso, cliente inexistente, variante inexistente, número duplicado, sem itens |
| `v1-list-sales-orders.e2e.spec.ts`         | Listagem paginada, filtro por status                               |
| `v1-get-sales-order-by-id.e2e.spec.ts`     | Busca por ID válido e inválido                                     |
| `v1-update-sales-order-status.e2e.spec.ts` | Transições válidas (PENDING→CONFIRMED), bloqueios (DRAFT→IN_TRANSIT), status final imutável |
| `v1-cancel-sales-order.e2e.spec.ts`        | Cancelamento com sucesso, pedido em status final                   |

### Factories de Teste

As factories de repositório in-memory estão em:
- `src/repositories/sales/in-memory/in-memory-customers-repository.ts`
- `src/repositories/sales/in-memory/in-memory-sales-orders-repository.ts`
- `src/repositories/sales/in-memory/in-memory-item-reservations-repository.ts`
- `src/repositories/sales/in-memory/in-memory-variant-promotions-repository.ts`
- `src/repositories/sales/in-memory/in-memory-comments-repository.ts`
- `src/repositories/sales/in-memory/in-memory-notification-preferences-repository.ts`

---

## Inconsistências Encontradas

1. **`POST /v1/item-reservations` sem permissão RBAC:** O controller usa apenas `verifyJwt`, sem `createPermissionMiddleware`. Qualquer usuário autenticado em um tenant pode criar reservas, mesmo sem a permissão `sales.reservations.create` definida no `permission-codes.ts`. Avaliar se é comportamento intencional.

2. **`entityType` em `Comment` é string livre no banco:** O campo `entityType` está definido como `String @db.VarChar(32)` no Prisma (sem enum), mas o `CreateCommentUseCase` restringe os valores aceitos a `['CUSTOMER', 'PRODUCT', 'SALES_ORDER']` em tempo de aplicação. O `EntityType` value object aceita mais valores (`VARIANT`, `ITEM`, etc.) do que o use case permite — possível expansão futura não refletida na validação do endpoint.

3. **Ausência de `verifyTenant` em `v1-create-item-reservation.controller.ts`:** O controller extrai `tenantId` via `request.user.tenantId!` mas não aplica o middleware `verifyTenant` explicitamente (diferente dos controllers de customers e sales-orders que o aplicam). O `!` (non-null assertion) pode resultar em erro de runtime se chamado sem tenant selecionado.

---

## Audit History

| Data       | Dimensão        | Pontuação | Relatório |
|------------|-----------------|-----------|-----------|
| 2026-03-10 | Documentação    | —         | Geração inicial da documentação do módulo Sales |
