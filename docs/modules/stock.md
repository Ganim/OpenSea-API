# Module: Stock

## Overview

O módulo **Stock** é o núcleo do sistema OpenSea e responsável pela gestão completa do inventário de produtos. Ele abrange todo o ciclo de vida dos itens: desde o cadastro hierárquico (Template → Produto → Variante → Item), passando pelo armazenamento físico (Armazém → Zona → Bin), movimentações, pedidos de compra, expedição por volumes e geração de etiquetas.

**Responsabilidades principais:**

- Cadastro e classificação de produtos com estrutura hierárquica em três níveis (produto, variante, item)
- Geração automática de códigos hierárquicos (`fullCode`) e códigos de barras (Code128, EAN-13, UPC)
- Controle físico de localização: armazéns, zonas e bins com endereços únicos
- Registro de movimentações de estoque com trilha de auditoria
- Gestão de pedidos de compra com fluxo de aprovação
- Expedição por volumes com geração de romaneio
- Etiquetas físicas configuráveis por template
- Instruções de cuidado (lavagem têxtil) e anexos de produto/variante

**Dependências com outros módulos:**

- `core` — usuários, tenants, autenticação JWT
- `hr` — vínculo com `Organization` para produtos ligados à organização interna
- `sales` — `SalesOrder` referenciado em movimentações e volumes
- `rbac` — permissões granulares por recurso
- `audit` — log de todas as ações sensíveis

---

## Entities

### Template

O Template define a **estrutura de atributos** que produtos, variantes e itens de um determinado tipo terão. Todo produto obrigatoriamente pertence a um template. O código hierárquico do template (3 dígitos, ex: `001`) é o primeiro segmento do `fullCode` de produto.

| Campo               | Tipo                  | Obrigatório | Validação                               | Descrição                                            |
| ------------------- | --------------------- | ----------- | --------------------------------------- | ---------------------------------------------------- |
| `id`                | UUID                  | Sim         | —                                       | Identificador único                                  |
| `tenantId`          | UUID                  | Sim         | —                                       | Isolamento multi-tenant                              |
| `code`              | string                | Não         | 3 dígitos, único por tenant             | Código hierárquico auto-gerado (ex: `001`)           |
| `sequentialCode`    | number                | Sim         | autoincrement                           | Gerado automaticamente para compor o `code`          |
| `name`              | string                | Sim         | max 128 chars, único por tenant (ativo) | Nome do template                                     |
| `iconUrl`           | string                | Não         | max 512 chars                           | URL do ícone SVG do template                         |
| `unitOfMeasure`     | UnitOfMeasure         | Sim         | enum                                    | Unidade de medida padrão dos produtos deste template |
| `productAttributes` | TemplateAttributesMap | Sim         | JSON                                    | Definição tipada dos atributos do produto            |
| `variantAttributes` | TemplateAttributesMap | Sim         | JSON                                    | Definição tipada dos atributos da variante           |
| `itemAttributes`    | TemplateAttributesMap | Sim         | JSON                                    | Definição tipada dos atributos do item               |
| `specialModules`    | string[]              | Sim         | —                                       | Módulos especiais habilitados (ex: `care-labels`)    |
| `isActive`          | boolean               | Sim         | default: `true`                         | Controle de ativação                                 |
| `createdAt`         | Date                  | Sim         | —                                       | Data de criação                                      |
| `updatedAt`         | Date                  | Não         | —                                       | Data da última atualização                           |
| `deletedAt`         | Date                  | Não         | —                                       | Soft delete                                          |

**TemplateAttribute** (estrutura de cada atributo dentro do mapa):

| Campo           | Tipo                                            | Descrição                                    |
| --------------- | ----------------------------------------------- | -------------------------------------------- |
| `type`          | `string \| number \| boolean \| date \| select` | Tipo do dado                                 |
| `label`         | string?                                         | Rótulo de exibição (ex: "Cor", "Tamanho")    |
| `required`      | boolean?                                        | Se o atributo é obrigatório                  |
| `defaultValue`  | unknown?                                        | Valor padrão                                 |
| `unitOfMeasure` | string?                                         | Unidade (ex: "kg", "cm")                     |
| `enablePrint`   | boolean?                                        | Incluir na impressão de etiqueta             |
| `enableView`    | boolean?                                        | Exibir na visualização                       |
| `options`       | string[]?                                       | Opções disponíveis (apenas `type: 'select'`) |
| `mask`          | string?                                         | Máscara de entrada (ex: `###.###.###-##`)    |

**Relacionamentos:**

- `Template` 1 → N `Product`

---

### Product

O produto é o segundo nível da hierarquia. Cada produto pertence a um template e pode ter múltiplas variantes.

| Campo            | Tipo          | Obrigatório | Validação                          | Descrição                                          |
| ---------------- | ------------- | ----------- | ---------------------------------- | -------------------------------------------------- |
| `id`             | UUID          | Sim         | —                                  | Identificador único                                |
| `tenantId`       | UUID          | Sim         | —                                  | Isolamento multi-tenant                            |
| `name`           | string        | Sim         | max 256 chars                      | Nome do produto                                    |
| `slug`           | Slug          | Sim         | único por tenant (ativo), imutável | Slug gerado do nome                                |
| `fullCode`       | string        | Sim         | único global, imutável             | Código hierárquico ex: `001.001.0001`              |
| `sequentialCode` | number        | Sim         | autoincrement                      | Sequencial dentro do tenant                        |
| `barcode`        | string        | Sim         | único global, imutável             | Code128 gerado do `fullCode`                       |
| `eanCode`        | string        | Sim         | único global, 13 chars, imutável   | EAN-13 gerado do `fullCode`                        |
| `upcCode`        | string        | Sim         | único global, 12 chars, imutável   | UPC gerado do `fullCode`                           |
| `qrCode`         | string        | Não         | max 512 chars                      | QR Code editável pelo usuário                      |
| `description`    | string        | Não         | Text                               | Descrição longa                                    |
| `status`         | ProductStatus | Sim         | enum                               | Estado do produto                                  |
| `outOfLine`      | boolean       | Sim         | default: `false`                   | Produto fora de linha                              |
| `attributes`     | JSON          | Sim         | default: `{}`                      | Atributos conforme `productAttributes` do template |
| `templateId`     | UUID          | Sim         | FK → Template                      | Template ao qual pertence                          |
| `supplierId`     | UUID          | Não         | FK → Supplier                      | Fornecedor (campo legado)                          |
| `manufacturerId` | UUID          | Não         | FK → Manufacturer                  | Fabricante                                         |
| `organizationId` | UUID          | Não         | FK → Organization                  | Organização interna (unificado)                    |
| `createdAt`      | Date          | Sim         | —                                  | Data de criação                                    |
| `updatedAt`      | Date          | Não         | —                                  | Data da última atualização                         |
| `deletedAt`      | Date          | Não         | —                                  | Soft delete                                        |

**Propriedades computadas:**

- `canBeSold` — `status.canBeSold && !isDeleted`
- `isPublishable` — `status.canBePublished && !isDeleted`
- `displayCode` — retorna `fullCode ?? id`

**Métodos de negócio:**

- `activate()`, `deactivate()`, `markAsOutOfStock()`, `discontinue()`, `delete()`, `restore()`

**Relacionamentos:**

- `Product` N → 1 `Template`
- `Product` N → 1 `Supplier` (opcional, legado)
- `Product` N → 1 `Manufacturer` (opcional)
- `Product` N → 1 `Organization` (opcional)
- `Product` 1 → N `Variant`
- `Product` N → N `Category` (via `ProductCategory`)
- `Product` N → N `Tag` (via `ProductTag`)
- `Product` 1 → N `ProductCareInstruction`
- `Product` 1 → N `ProductAttachment`

---

### Variant

A variante é o terceiro nível da hierarquia e representa uma variação específica de um produto (cor, tamanho, etc.). Cada variante tem seu próprio preço, custo e códigos de barras.

| Campo                   | Tipo    | Obrigatório | Validação                              | Descrição                                          |
| ----------------------- | ------- | ----------- | -------------------------------------- | -------------------------------------------------- |
| `id`                    | UUID    | Sim         | —                                      | Identificador único                                |
| `tenantId`              | UUID    | Sim         | —                                      | Isolamento multi-tenant                            |
| `productId`             | UUID    | Sim         | FK → Product                           | Produto pai                                        |
| `sku`                   | string  | Não         | max 64 chars, único por tenant (ativo) | SKU manual opcional                                |
| `slug`                  | Slug    | Sim         | único por tenant (ativo), imutável     | Slug gerado do nome                                |
| `fullCode`              | string  | Sim         | único global, imutável                 | Código hierárquico ex: `001.001.0001.001`          |
| `sequentialCode`        | number  | Sim         | sequencial local ao produto            | Código sequencial dentro do produto                |
| `name`                  | string  | Sim         | max 256 chars                          | Nome da variante                                   |
| `barcode`               | string  | Sim         | único global, imutável                 | Code128 gerado do `fullCode`                       |
| `eanCode`               | string  | Sim         | único global, imutável                 | EAN-13 gerado do `fullCode`                        |
| `upcCode`               | string  | Sim         | único global, imutável                 | UPC gerado do `fullCode`                           |
| `qrCode`                | string  | Não         | max 512 chars                          | QR Code editável                                   |
| `price`                 | Decimal | Sim         | ≥ 0, default: 0                        | Preço de venda                                     |
| `costPrice`             | Decimal | Não         | ≥ 0                                    | Preço de custo                                     |
| `profitMargin`          | Decimal | Não         | 0–100                                  | Margem de lucro (%)                                |
| `colorHex`              | string  | Não         | formato `#RRGGBB`                      | Cor primária em hex                                |
| `colorPantone`          | string  | Não         | max 32 chars                           | Pantone da cor primária                            |
| `secondaryColorHex`     | string  | Não         | formato `#RRGGBB`                      | Cor secundária em hex                              |
| `secondaryColorPantone` | string  | Não         | max 32 chars                           | Pantone da cor secundária                          |
| `pattern`               | Pattern | Não         | enum Prisma                            | Padrão/estampa                                     |
| `minStock`              | Decimal | Não         | ≥ 0                                    | Estoque mínimo                                     |
| `maxStock`              | Decimal | Não         | ≥ 0                                    | Estoque máximo                                     |
| `reorderPoint`          | Decimal | Não         | ≥ 0                                    | Ponto de reposição                                 |
| `reorderQuantity`       | Decimal | Não         | ≥ 0                                    | Quantidade de reposição                            |
| `reference`             | string  | Não         | max 128 chars                          | Referência do fornecedor/fabricante                |
| `similars`              | JSON    | Não         | array de IDs                           | Variantes semelhantes                              |
| `outOfLine`             | boolean | Sim         | default: `false`                       | Variante fora de linha                             |
| `isActive`              | boolean | Sim         | default: `true`                        | Controle de ativação                               |
| `attributes`            | JSON    | Sim         | default: `{}`                          | Atributos conforme `variantAttributes` do template |
| `createdAt`             | Date    | Sim         | —                                      | Data de criação                                    |
| `updatedAt`             | Date    | Não         | —                                      | Data da última atualização                         |
| `deletedAt`             | Date    | Não         | —                                      | Soft delete                                        |

**Propriedades computadas:**

- `calculatedProfitMargin` — `((price - costPrice) / costPrice) * 100`
- `netProfit` — `price - costPrice`
- `hasGoodMargin` — margem ≥ 30%
- `hasPoorMargin` — margem < 10%
- `hasStockControl` — qualquer dos campos de estoque definido

**Relacionamentos:**

- `Variant` N → 1 `Product` (cascade delete)
- `Variant` 1 → N `Item`
- `Variant` 1 → N `VariantPriceHistory`
- `Variant` 1 → N `VariantImage`
- `Variant` 1 → N `VariantAttachment`
- `Variant` 1 → N `PurchaseOrderItem`

---

### Item

O item é o nível mais granular — representa uma unidade física real no estoque com quantidade, localização física e rastreabilidade completa.

| Campo               | Tipo       | Obrigatório | Validação                               | Descrição                                        |
| ------------------- | ---------- | ----------- | --------------------------------------- | ------------------------------------------------ |
| `id`                | UUID       | Sim         | —                                       | Identificador único                              |
| `tenantId`          | UUID       | Sim         | —                                       | Isolamento multi-tenant                          |
| `variantId`         | UUID       | Sim         | FK → Variant                            | Variante à qual pertence                         |
| `uniqueCode`        | string     | Não         | max 128 chars, único por tenant (ativo) | Código único manual opcional                     |
| `slug`              | Slug       | Sim         | único por tenant (ativo), imutável      | Slug gerado automaticamente                      |
| `fullCode`          | string     | Sim         | único global, imutável                  | Código hierárquico ex: `001.001.0001.001-00001`  |
| `sequentialCode`    | number     | Sim         | sequencial local à variante             | Código sequencial dentro da variante             |
| `barcode`           | string     | Sim         | único global, imutável                  | Code128 gerado do `fullCode`                     |
| `eanCode`           | string     | Sim         | único global, imutável                  | EAN-13 gerado do `fullCode`                      |
| `upcCode`           | string     | Sim         | único global, imutável                  | UPC gerado do `fullCode`                         |
| `qrCode`            | string     | Não         | max 512 chars                           | QR Code editável                                 |
| `binId`             | UUID       | Não         | FK → Bin                                | Bin onde o item está armazenado                  |
| `lastKnownAddress`  | string     | Não         | max 64 chars                            | Último endereço preservado quando bin é removido |
| `initialQuantity`   | Decimal    | Sim         | —                                       | Quantidade de entrada                            |
| `currentQuantity`   | Decimal    | Sim         | ≥ 0                                     | Quantidade atual                                 |
| `unitCost`          | Decimal    | Não         | ≥ 0                                     | Custo unitário de aquisição                      |
| `status`            | ItemStatus | Sim         | enum                                    | Status do item                                   |
| `entryDate`         | Date       | Sim         | default: now()                          | Data de entrada no estoque                       |
| `batchNumber`       | string     | Não         | max 64 chars                            | Número do lote                                   |
| `manufacturingDate` | Date       | Não         | —                                       | Data de fabricação                               |
| `expiryDate`        | Date       | Não         | —                                       | Data de vencimento                               |
| `attributes`        | JSON       | Sim         | default: `{}`                           | Atributos conforme `itemAttributes` do template  |
| `createdAt`         | Date       | Sim         | —                                       | Data de criação                                  |
| `updatedAt`         | Date       | Não         | —                                       | Data da última atualização                       |
| `deletedAt`         | Date       | Não         | —                                       | Soft delete                                      |

**Propriedades computadas:**

- `totalCost` — `unitCost * currentQuantity`
- `quantityUsed` — `initialQuantity - currentQuantity`
- `utilizationPercentage` — percentual consumido
- `isExpired` — `expiryDate < now()`
- `isExpiringSoon` — vence em ≤ 30 dias
- `daysUntilExpiry` — dias até o vencimento
- `canBeSold` — `status.canBeSold && !isEmpty && !isExpired && !isDeleted`
- `canBeReserved` — `status.canBeReserved && !isEmpty && !isExpired && !isDeleted`

**Métodos de negócio:**

- `addQuantity(amount)`, `removeQuantity(amount)` — gestão de quantidade com validação
- `reserve()`, `makeAvailable()`, `markAsDamaged()`, `markAsExpired()`, `dispose()`, `delete()`, `restore()`

**Relacionamentos:**

- `Item` N → 1 `Variant`
- `Item` N → 1 `Bin` (opcional)
- `Item` 1 → N `ItemMovement`
- `Item` 1 → N `ItemReservation`
- `Item` N → N `Volume` (via `VolumeItem`)

---

### ItemMovement

Registra cada movimentação de estoque de um item. Imutável após criação (sem soft delete).

| Campo            | Tipo         | Obrigatório | Validação       | Descrição                                     |
| ---------------- | ------------ | ----------- | --------------- | --------------------------------------------- |
| `id`             | UUID         | Sim         | —               | Identificador único                           |
| `tenantId`       | UUID         | Sim         | —               | Isolamento multi-tenant                       |
| `itemId`         | UUID         | Sim         | FK → Item       | Item movimentado                              |
| `userId`         | UUID         | Sim         | FK → User       | Usuário que realizou a movimentação           |
| `quantity`       | Decimal      | Sim         | > 0             | Quantidade movimentada                        |
| `quantityBefore` | Decimal      | Não         | —               | Quantidade antes da movimentação              |
| `quantityAfter`  | Decimal      | Não         | —               | Quantidade após a movimentação                |
| `movementType`   | MovementType | Sim         | enum            | Tipo de movimentação                          |
| `reasonCode`     | string       | Não         | max 64 chars    | Código de motivo                              |
| `destinationRef` | string       | Não         | max 128 chars   | Referência do destino (ex: Pedido #123)       |
| `originRef`      | string       | Não         | max 128 chars   | Referência da origem (ex: Bin: FAB-EST-102-B) |
| `batchNumber`    | string       | Não         | max 64 chars    | Número do lote                                |
| `notes`          | string       | Não         | Text            | Observações                                   |
| `approvedBy`     | UUID         | Não         | FK → User       | Aprovador (para tipos que exigem aprovação)   |
| `salesOrderId`   | UUID         | Não         | FK → SalesOrder | Pedido de venda relacionado                   |
| `createdAt`      | Date         | Sim         | —               | Data do registro                              |

**Propriedades computadas:**

- `isStockReduction` — `movementType.reducesStock`
- `isStockIncrease` — `movementType.increasesStock`
- `requiresApproval` — `movementType.requiresApproval`
- `quantityDelta` — delta líquido (positivo ou negativo)

**Relacionamentos:**

- `ItemMovement` N → 1 `Item`
- `ItemMovement` N → 1 `User` (executor)
- `ItemMovement` N → 1 `User` (aprovador, opcional)
- `ItemMovement` N → 1 `SalesOrder` (opcional)

---

### Warehouse

Representa um armazém físico. É o nível superior da hierarquia de localização.

| Campo         | Tipo    | Obrigatório | Validação                                      | Descrição                            |
| ------------- | ------- | ----------- | ---------------------------------------------- | ------------------------------------ |
| `id`          | UUID    | Sim         | —                                              | Identificador único                  |
| `tenantId`    | UUID    | Sim         | —                                              | Isolamento multi-tenant              |
| `code`        | string  | Sim         | 2–5 chars, UPPERCASE, único por tenant (ativo) | Código do armazém (ex: `FAB`, `CD1`) |
| `name`        | string  | Sim         | max 128 chars                                  | Nome do armazém                      |
| `description` | string  | Não         | max 500 chars                                  | Descrição                            |
| `address`     | string  | Não         | max 256 chars                                  | Endereço físico                      |
| `isActive`    | boolean | Sim         | default: `true`                                | Controle de ativação                 |
| `createdAt`   | Date    | Sim         | —                                              | Data de criação                      |
| `updatedAt`   | Date    | Sim         | —                                              | Data da última atualização           |
| `deletedAt`   | Date    | Não         | —                                              | Soft delete                          |

**Relacionamentos:**

- `Warehouse` 1 → N `Zone`

---

### Zone

Zona de armazenamento dentro de um armazém. Contém a estrutura física de bins (corredores × prateleiras × nichos) e, opcionalmente, um layout visual.

| Campo         | Tipo                 | Obrigatório | Validação                              | Descrição                                   |
| ------------- | -------------------- | ----------- | -------------------------------------- | ------------------------------------------- |
| `id`          | UUID                 | Sim         | —                                      | Identificador único                         |
| `tenantId`    | UUID                 | Sim         | —                                      | Isolamento multi-tenant                     |
| `warehouseId` | UUID                 | Sim         | FK → Warehouse (cascade delete)        | Armazém pai                                 |
| `code`        | string               | Sim         | max 5 chars, único por armazém (ativo) | Código da zona (ex: `EST`, `PRD`)           |
| `name`        | string               | Sim         | max 128 chars                          | Nome da zona                                |
| `description` | string               | Não         | max 500 chars                          | Descrição                                   |
| `structure`   | ZoneStructure (JSON) | Sim         | default: `{}`                          | Configuração de aisles × shelves × bins     |
| `layout`      | ZoneLayout (JSON)    | Não         | —                                      | Layout visual (canvas, posições, anotações) |
| `isActive`    | boolean              | Sim         | default: `true`                        | Controle de ativação                        |
| `createdAt`   | Date                 | Sim         | —                                      | Data de criação                             |
| `updatedAt`   | Date                 | Sim         | —                                      | Data da última atualização                  |
| `deletedAt`   | Date                 | Não         | —                                      | Soft delete                                 |

**Relacionamentos:**

- `Zone` N → 1 `Warehouse`
- `Zone` 1 → N `Bin` (cascade delete)

---

### Bin

Representa um endereço físico específico dentro de uma zona (nicho de prateleira). É o local onde os itens ficam armazenados.

| Campo              | Tipo    | Obrigatório | Validação                              | Descrição                               |
| ------------------ | ------- | ----------- | -------------------------------------- | --------------------------------------- |
| `id`               | UUID    | Sim         | —                                      | Identificador único                     |
| `tenantId`         | UUID    | Sim         | —                                      | Isolamento multi-tenant                 |
| `zoneId`           | UUID    | Sim         | FK → Zone (cascade delete)             | Zona pai                                |
| `address`          | string  | Sim         | max 32 chars, único por tenant (ativo) | Endereço completo (ex: `FAB-EST-102-B`) |
| `aisle`            | number  | Sim         | 1–99                                   | Corredor                                |
| `shelf`            | number  | Sim         | 1–999                                  | Prateleira                              |
| `position`         | string  | Sim         | max 3 chars                            | Nicho (`A`, `B` ou `1`, `2`)            |
| `capacity`         | number  | Não         | ≥ 0                                    | Capacidade máxima (opcional)            |
| `currentOccupancy` | number  | Sim         | ≥ 0, default: 0                        | Ocupação atual                          |
| `isActive`         | boolean | Sim         | default: `true`                        | Controle de ativação                    |
| `isBlocked`        | boolean | Sim         | default: `false`                       | Indica se o bin está bloqueado          |
| `blockReason`      | string  | Não         | max 256 chars                          | Motivo do bloqueio                      |
| `createdAt`        | Date    | Sim         | —                                      | Data de criação                         |
| `updatedAt`        | Date    | Sim         | —                                      | Data da última atualização              |
| `deletedAt`        | Date    | Não         | —                                      | Soft delete                             |

**Propriedades computadas:**

- `occupancyPercentage` — percentual de ocupação
- `isFull` — `currentOccupancy >= capacity`
- `isEmpty` — `currentOccupancy === 0`
- `availableSpace` — espaço disponível
- `isAvailable` — `isActive && !isBlocked && !isFull`

**Relacionamentos:**

- `Bin` N → 1 `Zone`
- `Bin` 1 → N `Item`
- `Bin` 1 → N `StockSnapshot`

---

### Supplier

Fornecedor externo de produtos.

| Campo            | Tipo    | Obrigatório | Validação                     | Descrição                  |
| ---------------- | ------- | ----------- | ----------------------------- | -------------------------- |
| `id`             | UUID    | Sim         | —                             | Identificador único        |
| `tenantId`       | UUID    | Sim         | —                             | Isolamento multi-tenant    |
| `sequentialCode` | number  | Sim         | autoincrement                 | Código sequencial          |
| `name`           | string  | Sim         | max 128 chars                 | Nome do fornecedor         |
| `cnpj`           | string  | Não         | max 256 chars (criptografado) | CNPJ                       |
| `cnpjHash`       | string  | Não         | max 64 chars (blind index)    | Hash do CNPJ para busca    |
| `taxId`          | string  | Não         | max 32 chars                  | Inscrição Estadual         |
| `contact`        | string  | Não         | max 256 chars                 | Nome do contato            |
| `email`          | string  | Não         | max 512 chars                 | E-mail                     |
| `emailHash`      | string  | Não         | max 64 chars (blind index)    | Hash do e-mail             |
| `phone`          | string  | Não         | max 256 chars                 | Telefone                   |
| `website`        | string  | Não         | max 512 chars                 | Website                    |
| `address`        | string  | Não         | max 512 chars                 | Endereço                   |
| `city`           | string  | Não         | max 128 chars                 | Cidade                     |
| `state`          | string  | Não         | 2 chars                       | UF                         |
| `zipCode`        | string  | Não         | max 10 chars                  | CEP                        |
| `country`        | string  | Não         | max 64 chars                  | País                       |
| `paymentTerms`   | string  | Não         | max 256 chars                 | Condições de pagamento     |
| `rating`         | Decimal | Não         | 0.00–5.00                     | Avaliação                  |
| `isActive`       | boolean | Sim         | default: `true`               | Controle de ativação       |
| `notes`          | string  | Não         | Text                          | Observações                |
| `createdAt`      | Date    | Sim         | —                             | Data de criação            |
| `updatedAt`      | Date    | Sim         | —                             | Data da última atualização |
| `deletedAt`      | Date    | Não         | —                             | Soft delete                |

**Relacionamentos:**

- `Supplier` 1 → N `Product`
- `Supplier` 1 → N `PurchaseOrder`

---

### Manufacturer

Fabricante dos produtos. Possui código hierárquico de 3 dígitos que integra o `fullCode` dos produtos.

| Campo            | Tipo    | Obrigatório | Validação                     | Descrição                      |
| ---------------- | ------- | ----------- | ----------------------------- | ------------------------------ |
| `id`             | UUID    | Sim         | —                             | Identificador único            |
| `tenantId`       | UUID    | Sim         | —                             | Isolamento multi-tenant        |
| `code`           | string  | Sim         | 3 chars, único por tenant     | Código hierárquico (ex: `001`) |
| `sequentialCode` | number  | Sim         | autoincrement                 | Para geração do code           |
| `name`           | string  | Sim         | max 128 chars                 | Nome do fabricante             |
| `legalName`      | string  | Não         | max 256 chars                 | Razão social                   |
| `cnpj`           | string  | Não         | max 256 chars (criptografado) | CNPJ                           |
| `cnpjHash`       | string  | Não         | max 64 chars (blind index)    | Hash do CNPJ                   |
| `country`        | string  | Não         | max 64 chars                  | País de origem                 |
| `email`          | string  | Não         | max 512 chars                 | E-mail                         |
| `phone`          | string  | Não         | max 256 chars                 | Telefone                       |
| `website`        | string  | Não         | max 512 chars                 | Website                        |
| `address`        | string  | Não         | max 512 chars                 | Endereço                       |
| `city`           | string  | Não         | max 128 chars                 | Cidade                         |
| `state`          | string  | Não         | max 64 chars                  | Estado                         |
| `zipCode`        | string  | Não         | max 10 chars                  | CEP                            |
| `isActive`       | boolean | Sim         | default: `true`               | Controle de ativação           |
| `rating`         | Decimal | Não         | 0.00–5.00                     | Avaliação                      |
| `notes`          | string  | Não         | Text                          | Observações                    |
| `createdAt`      | Date    | Sim         | —                             | Data de criação                |
| `updatedAt`      | Date    | Sim         | —                             | Data da última atualização     |
| `deletedAt`      | Date    | Não         | —                             | Soft delete                    |

**Relacionamentos:**

- `Manufacturer` 1 → N `Product`

---

### Category

Categoria hierárquica para classificação de produtos. Suporta subcategorias com relacionamento recursivo.

| Campo          | Tipo    | Obrigatório | Validação                       | Descrição                  |
| -------------- | ------- | ----------- | ------------------------------- | -------------------------- |
| `id`           | UUID    | Sim         | —                               | Identificador único        |
| `tenantId`     | UUID    | Sim         | —                               | Isolamento multi-tenant    |
| `name`         | string  | Sim         | max 128 chars                   | Nome da categoria          |
| `slug`         | string  | Sim         | único por tenant (ativo)        | Slug da categoria          |
| `description`  | string  | Não         | max 500 chars                   | Descrição                  |
| `iconUrl`      | string  | Não         | max 512 chars                   | URL do ícone SVG           |
| `parentId`     | UUID    | Não         | FK → Category (auto-referência) | Categoria pai              |
| `displayOrder` | number  | Sim         | default: 0                      | Ordem de exibição          |
| `isActive`     | boolean | Sim         | default: `true`                 | Controle de ativação       |
| `createdAt`    | Date    | Sim         | —                               | Data de criação            |
| `updatedAt`    | Date    | Sim         | —                               | Data da última atualização |
| `deletedAt`    | Date    | Não         | —                               | Soft delete                |

**Relacionamentos:**

- `Category` N → 1 `Category` (pai, auto-referência)
- `Category` 1 → N `Category` (filhas)
- `Category` N → N `Product` (via `ProductCategory`)

---

### Tag

Tag de classificação livre para produtos.

| Campo         | Tipo   | Obrigatório | Validação                      | Descrição                  |
| ------------- | ------ | ----------- | ------------------------------ | -------------------------- |
| `id`          | UUID   | Sim         | —                              | Identificador único        |
| `tenantId`    | UUID   | Sim         | —                              | Isolamento multi-tenant    |
| `name`        | string | Sim         | max 64 chars, único por tenant | Nome da tag                |
| `slug`        | string | Sim         | único por tenant               | Slug da tag                |
| `color`       | string | Não         | formato `#RRGGBB`              | Cor para exibição          |
| `description` | string | Não         | max 256 chars                  | Descrição                  |
| `createdAt`   | Date   | Sim         | —                              | Data de criação            |
| `updatedAt`   | Date   | Sim         | —                              | Data da última atualização |
| `deletedAt`   | Date   | Não         | —                              | Soft delete                |

---

### PurchaseOrder

Pedido de compra de variantes junto a um fornecedor.

| Campo          | Tipo                | Obrigatório | Validação                      | Descrição                    |
| -------------- | ------------------- | ----------- | ------------------------------ | ---------------------------- |
| `id`           | UUID                | Sim         | —                              | Identificador único          |
| `tenantId`     | UUID                | Sim         | —                              | Isolamento multi-tenant      |
| `orderNumber`  | string              | Sim         | único por tenant               | Número do pedido             |
| `status`       | OrderStatus         | Sim         | enum (compartilhado com sales) | Status do pedido             |
| `supplierId`   | UUID                | Sim         | FK → Supplier                  | Fornecedor                   |
| `createdBy`    | UUID                | Não         | FK → User                      | Usuário criador              |
| `totalCost`    | Decimal             | Sim         | calculado automaticamente      | Custo total (soma dos itens) |
| `expectedDate` | Date                | Não         | —                              | Data prevista de entrega     |
| `receivedDate` | Date                | Não         | —                              | Data de recebimento efetivo  |
| `notes`        | string              | Não         | Text                           | Observações                  |
| `items`        | PurchaseOrderItem[] | Sim         | —                              | Itens do pedido              |
| `createdAt`    | Date                | Sim         | —                              | Data de criação              |
| `updatedAt`    | Date                | Não         | —                              | Data da última atualização   |
| `deletedAt`    | Date                | Não         | —                              | Soft delete                  |

**PurchaseOrderItem:**

| Campo       | Tipo    | Descrição                                        |
| ----------- | ------- | ------------------------------------------------ |
| `variantId` | UUID    | Variante pedida                                  |
| `quantity`  | Decimal | Quantidade                                       |
| `unitCost`  | Decimal | Custo unitário                                   |
| `totalCost` | Decimal | Calculado automaticamente: `quantity × unitCost` |
| `notes`     | string? | Observações do item                              |

**Métodos de negócio:**

- `confirm()` — apenas de status PENDING
- `receive()` — apenas de status CONFIRMED, define `receivedDate`
- `cancel()` — não permitido em status finais
- `addItem()`, `removeItem()` — recalculam `totalCost`

**Relacionamentos:**

- `PurchaseOrder` N → 1 `Supplier`
- `PurchaseOrder` N → 1 `User` (criador)
- `PurchaseOrder` 1 → N `PurchaseOrderItem`

---

### Volume

Volume de expedição (romaneio). Agrupa itens para envio.

| Campo            | Tipo         | Obrigatório | Validação        | Descrição                   |
| ---------------- | ------------ | ----------- | ---------------- | --------------------------- |
| `id`             | UUID         | Sim         | —                | Identificador único         |
| `tenantId`       | UUID         | Sim         | —                | Isolamento multi-tenant     |
| `code`           | string       | Sim         | único por tenant | Código do volume (gerado)   |
| `name`           | string       | Não         | max 256 chars    | Nome/descrição              |
| `status`         | VolumeStatus | Sim         | enum             | Status do volume            |
| `notes`          | string       | Não         | Text             | Observações                 |
| `destinationRef` | string       | Não         | max 256 chars    | Referência do destino       |
| `salesOrderId`   | string       | Não         | —                | Pedido de venda relacionado |
| `customerId`     | string       | Não         | —                | Cliente                     |
| `closedAt`       | Date         | Não         | —                | Data de fechamento          |
| `deliveredAt`    | Date         | Não         | —                | Data de entrega             |
| `returnedAt`     | Date         | Não         | —                | Data de devolução           |
| `createdBy`      | string       | Sim         | FK → User        | Usuário criador             |
| `closedBy`       | string       | Não         | FK → User        | Usuário que fechou          |
| `deliveredBy`    | string       | Não         | FK → User        | Usuário que entregou        |
| `createdAt`      | Date         | Sim         | —                | Data de criação             |
| `updatedAt`      | Date         | Sim         | —                | Data da última atualização  |
| `deletedAt`      | Date         | Não         | —                | Soft delete                 |

**Relacionamentos:**

- `Volume` 1 → N `VolumeItem`
- `VolumeItem` N → 1 `Item`

---

## Value Objects

### ProductStatus

Encapsula o status de um produto com regras de negócio embutidas.

| Valor          | Pode Vender | Pode Publicar | Visível |
| -------------- | ----------- | ------------- | ------- |
| `DRAFT`        | Não         | Não           | Não     |
| `ACTIVE`       | Sim         | Sim           | Sim     |
| `INACTIVE`     | Não         | Não           | Não     |
| `DISCONTINUED` | Não         | Não           | Não     |
| `OUT_OF_STOCK` | Não         | Não           | Sim     |

### ItemStatus

Encapsula o status de um item físico com regras de disponibilidade.

| Valor        | Pode Vender | Pode Reservar | Requer Ação |
| ------------ | ----------- | ------------- | ----------- |
| `AVAILABLE`  | Sim         | Sim           | Não         |
| `RESERVED`   | Não         | Não           | Não         |
| `IN_TRANSIT` | Não         | Não           | Não         |
| `DAMAGED`    | Não         | Não           | Sim         |
| `EXPIRED`    | Não         | Não           | Sim         |
| `DISPOSED`   | Não         | Não           | Não         |

### MovementType

Define o tipo de movimentação com regras sobre impacto no estoque e necessidade de aprovação.

| Valor                  | Aumenta Estoque | Reduz Estoque | Requer Aprovação |
| ---------------------- | --------------- | ------------- | ---------------- |
| `PURCHASE`             | Sim             | Não           | Não              |
| `CUSTOMER_RETURN`      | Sim             | Não           | Não              |
| `SALE`                 | Não             | Sim           | Não              |
| `PRODUCTION`           | Não             | Sim           | Não              |
| `SAMPLE`               | Não             | Sim           | Não              |
| `LOSS`                 | Não             | Sim           | **Sim**          |
| `SUPPLIER_RETURN`      | Não             | Sim           | Não              |
| `TRANSFER`             | Não             | Não           | Não              |
| `INVENTORY_ADJUSTMENT` | Não             | Não           | **Sim**          |
| `ZONE_RECONFIGURE`     | Não             | Não           | Não              |

### VolumeStatus

```
OPEN → CLOSED → DELIVERED
                     ↓
                  RETURNED
```

| Valor       | Descrição                              |
| ----------- | -------------------------------------- |
| `OPEN`      | Volume em montagem — aceitando itens   |
| `CLOSED`    | Volume fechado — pronto para expedição |
| `DELIVERED` | Entregue ao destino                    |
| `RETURNED`  | Devolvido                              |

### UnitOfMeasure

Define a unidade de medida padrão de um template com símbolo e nome completo.

| Valor           | Símbolo | Nome             | Categoria   |
| --------------- | ------- | ---------------- | ----------- |
| `UNITS`         | `un`    | Unidades         | Contável    |
| `METERS`        | `m`     | Metros           | Comprimento |
| `KILOGRAMS`     | `kg`    | Quilogramas      | Peso        |
| `GRAMS`         | `g`     | Gramas           | Peso        |
| `LITERS`        | `L`     | Litros           | Volume      |
| `MILLILITERS`   | `mL`    | Mililitros       | Volume      |
| `SQUARE_METERS` | `m²`    | Metros Quadrados | Área        |
| `PAIRS`         | `par`   | Pares            | Contável    |
| `BOXES`         | `cx`    | Caixas           | Contável    |
| `PACKS`         | `pct`   | Pacotes          | Contável    |

### Slug

Value Object responsável pela geração e validação de slugs.

- **Geração:** normalização NFKD → lowercase → hífens (sem acentos, sem underscores)
- **Padrão válido:** `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- **Imutável após criação** — não pode ser alterado após o registro

### ZoneStructure

Define a estrutura física de uma zona: corredores (`aisles`) × prateleiras (`shelvesPerAisle`) × nichos (`binsPerShelf`). Suporta configuração por corredor (`aisleConfigs`) e padrão de código (`CodePattern`).

- Computa `totalBins` e `totalShelves`
- Gera endereços de todos os bins via `generateAllAddresses(warehouseCode, zoneCode)`

### ZoneLayout

Define o layout visual da zona em um canvas 2D. Contém posições dos corredores (`aislePositions`), dimensões do canvas e anotações (portas, pilares, paredes, áreas).

---

## Endpoints

Todos os endpoints requerem autenticação JWT (`verifyJwt`) e seleção de tenant (`verifyTenant`), além da permissão específica indicada.

### Templates

| Método | Path                        | Permissão                | Descrição                   |
| ------ | --------------------------- | ------------------------ | --------------------------- |
| `POST` | `/v1/templates`             | `stock.templates.create` | Criar template              |
| `GET`  | `/v1/templates`             | `stock.templates.list`   | Listar templates (paginado) |
| `GET`  | `/v1/templates/:templateId` | `stock.templates.read`   | Obter template por ID       |
| `PUT`  | `/v1/templates/:templateId` | `stock.templates.update` | Atualizar template          |

### Products

| Método   | Path                      | Permissão               | Descrição                     |
| -------- | ------------------------- | ----------------------- | ----------------------------- |
| `POST`   | `/v1/products`            | `stock.products.create` | Criar produto                 |
| `GET`    | `/v1/products`            | `stock.products.list`   | Listar produtos (paginado)    |
| `GET`    | `/v1/products/:productId` | `stock.products.read`   | Obter produto por ID          |
| `PUT`    | `/v1/products/:productId` | `stock.products.update` | Atualizar produto             |
| `DELETE` | `/v1/products/:productId` | `stock.products.delete` | Excluir produto (soft delete) |

### Variants

| Método   | Path                               | Permissão               | Descrição                      |
| -------- | ---------------------------------- | ----------------------- | ------------------------------ |
| `POST`   | `/v1/variants`                     | `stock.variants.create` | Criar variante                 |
| `GET`    | `/v1/variants`                     | `stock.variants.list`   | Listar variantes               |
| `GET`    | `/v1/variants/:variantId`          | `stock.variants.read`   | Obter variante por ID          |
| `PUT`    | `/v1/variants/:variantId`          | `stock.variants.update` | Atualizar variante             |
| `DELETE` | `/v1/variants/:variantId`          | `stock.variants.delete` | Excluir variante (soft delete) |
| `GET`    | `/v1/products/:productId/variants` | `stock.variants.list`   | Listar variantes de um produto |

### Items

| Método | Path                                 | Permissão              | Descrição                        |
| ------ | ------------------------------------ | ---------------------- | -------------------------------- |
| `POST` | `/v1/items/entry`                    | `stock.items.entry`    | Registrar entrada de itens       |
| `POST` | `/v1/items/exit`                     | `stock.items.exit`     | Registrar saída de itens         |
| `POST` | `/v1/items/transfer`                 | `stock.items.transfer` | Transferir item entre bins       |
| `POST` | `/v1/items/batch-transfer`           | `stock.items.transfer` | Transferência em lote de itens   |
| `GET`  | `/v1/items`                          | `stock.items.list`     | Listar todos os itens            |
| `GET`  | `/v1/items/:itemId`                  | `stock.items.read`     | Obter item por ID                |
| `GET`  | `/v1/items/:itemId/location-history` | `stock.items.read`     | Histórico de localização do item |
| `GET`  | `/v1/items/:itemId/label-data`       | `stock.items.read`     | Dados para geração de etiqueta   |
| `GET`  | `/v1/products/:productId/items`      | `stock.items.list`     | Listar itens de um produto       |
| `GET`  | `/v1/variants/:variantId/items`      | `stock.items.list`     | Listar itens de uma variante     |

### Item Movements

| Método | Path                 | Permissão              | Descrição            |
| ------ | -------------------- | ---------------------- | -------------------- |
| `GET`  | `/v1/item-movements` | `stock.movements.list` | Listar movimentações |

### Warehouses

| Método   | Path                          | Permissão                 | Descrição                     |
| -------- | ----------------------------- | ------------------------- | ----------------------------- |
| `POST`   | `/v1/warehouses`              | `stock.warehouses.create` | Criar armazém                 |
| `GET`    | `/v1/warehouses`              | `stock.warehouses.list`   | Listar armazéns               |
| `GET`    | `/v1/warehouses/:warehouseId` | `stock.warehouses.read`   | Obter armazém por ID          |
| `PUT`    | `/v1/warehouses/:warehouseId` | `stock.warehouses.update` | Atualizar armazém             |
| `DELETE` | `/v1/warehouses/:warehouseId` | `stock.warehouses.delete` | Excluir armazém (soft delete) |

### Zones

| Método   | Path                                        | Permissão               | Descrição                             |
| -------- | ------------------------------------------- | ----------------------- | ------------------------------------- |
| `POST`   | `/v1/zones`                                 | `stock.zones.create`    | Criar zona                            |
| `GET`    | `/v1/zones`                                 | `stock.zones.list`      | Listar zonas                          |
| `GET`    | `/v1/zones/:zoneId`                         | `stock.zones.read`      | Obter zona por ID                     |
| `PUT`    | `/v1/zones/:zoneId`                         | `stock.zones.update`    | Atualizar zona                        |
| `PUT`    | `/v1/zones/:zoneId/structure`               | `stock.zones.configure` | Configurar estrutura de bins          |
| `PUT`    | `/v1/zones/:zoneId/layout`                  | `stock.zones.configure` | Atualizar layout visual               |
| `DELETE` | `/v1/zones/:zoneId/layout`                  | `stock.zones.configure` | Resetar layout visual                 |
| `POST`   | `/v1/zones/preview-structure`               | `stock.zones.read`      | Preview da estrutura antes de aplicar |
| `POST`   | `/v1/zones/:zoneId/preview-reconfiguration` | `stock.zones.read`      | Preview de reconfiguração             |
| `GET`    | `/v1/zones/:zoneId/item-stats`              | `stock.zones.read`      | Estatísticas de itens por zona        |

### Bins

| Método | Path                        | Permissão           | Descrição                |
| ------ | --------------------------- | ------------------- | ------------------------ |
| `GET`  | `/v1/bins`                  | `stock.bins.list`   | Listar bins              |
| `GET`  | `/v1/bins/available`        | `stock.bins.list`   | Listar bins disponíveis  |
| `GET`  | `/v1/bins/search`           | `stock.bins.search` | Buscar bins por endereço |
| `GET`  | `/v1/bins/occupancy-map`    | `stock.bins.list`   | Mapa de ocupação         |
| `GET`  | `/v1/bins/:binId`           | `stock.bins.read`   | Obter bin por ID         |
| `GET`  | `/v1/bins/:binId/detail`    | `stock.bins.read`   | Detalhe do bin com itens |
| `GET`  | `/v1/bins/address/:address` | `stock.bins.read`   | Obter bin por endereço   |
| `PUT`  | `/v1/bins/:binId`           | `stock.bins.update` | Atualizar bin            |
| `POST` | `/v1/bins/:binId/block`     | `stock.bins.manage` | Bloquear bin             |
| `POST` | `/v1/bins/:binId/unblock`   | `stock.bins.manage` | Desbloquear bin          |

### Suppliers

| Método   | Path                        | Permissão                | Descrição                        |
| -------- | --------------------------- | ------------------------ | -------------------------------- |
| `POST`   | `/v1/suppliers`             | `stock.suppliers.create` | Criar fornecedor                 |
| `GET`    | `/v1/suppliers`             | `stock.suppliers.list`   | Listar fornecedores              |
| `GET`    | `/v1/suppliers/:supplierId` | `stock.suppliers.read`   | Obter fornecedor por ID          |
| `PUT`    | `/v1/suppliers/:supplierId` | `stock.suppliers.update` | Atualizar fornecedor             |
| `DELETE` | `/v1/suppliers/:supplierId` | `stock.suppliers.delete` | Excluir fornecedor (soft delete) |

### Manufacturers

| Método   | Path                                | Permissão                    | Descrição                        |
| -------- | ----------------------------------- | ---------------------------- | -------------------------------- |
| `POST`   | `/v1/manufacturers`                 | `stock.manufacturers.create` | Criar fabricante                 |
| `GET`    | `/v1/manufacturers`                 | `stock.manufacturers.list`   | Listar fabricantes               |
| `GET`    | `/v1/manufacturers/:manufacturerId` | `stock.manufacturers.read`   | Obter fabricante por ID          |
| `PUT`    | `/v1/manufacturers/:manufacturerId` | `stock.manufacturers.update` | Atualizar fabricante             |
| `DELETE` | `/v1/manufacturers/:manufacturerId` | `stock.manufacturers.delete` | Excluir fabricante (soft delete) |

### Categories

| Método   | Path                         | Permissão                 | Descrição                       |
| -------- | ---------------------------- | ------------------------- | ------------------------------- |
| `POST`   | `/v1/categories`             | `stock.categories.create` | Criar categoria                 |
| `GET`    | `/v1/categories`             | `stock.categories.list`   | Listar categorias               |
| `GET`    | `/v1/categories/:categoryId` | `stock.categories.read`   | Obter categoria por ID          |
| `PUT`    | `/v1/categories/:categoryId` | `stock.categories.update` | Atualizar categoria             |
| `DELETE` | `/v1/categories/:categoryId` | `stock.categories.delete` | Excluir categoria (soft delete) |
| `PUT`    | `/v1/categories/reorder`     | `stock.categories.update` | Reordenar categorias            |

### Tags

| Método   | Path              | Permissão           | Descrição                 |
| -------- | ----------------- | ------------------- | ------------------------- |
| `POST`   | `/v1/tags`        | `stock.tags.create` | Criar tag                 |
| `GET`    | `/v1/tags`        | `stock.tags.list`   | Listar tags               |
| `GET`    | `/v1/tags/:tagId` | `stock.tags.read`   | Obter tag por ID          |
| `PUT`    | `/v1/tags/:tagId` | `stock.tags.update` | Atualizar tag             |
| `DELETE` | `/v1/tags/:tagId` | `stock.tags.delete` | Excluir tag (soft delete) |

### Purchase Orders

| Método | Path                                  | Permissão                      | Descrição                |
| ------ | ------------------------------------- | ------------------------------ | ------------------------ |
| `POST` | `/v1/purchase-orders`                 | `stock.purchase-orders.create` | Criar pedido de compra   |
| `GET`  | `/v1/purchase-orders`                 | `stock.purchase-orders.list`   | Listar pedidos de compra |
| `GET`  | `/v1/purchase-orders/:orderId`        | `stock.purchase-orders.read`   | Obter pedido por ID      |
| `POST` | `/v1/purchase-orders/:orderId/cancel` | `stock.purchase-orders.cancel` | Cancelar pedido          |

### Volumes

| Método   | Path                                  | Permissão                   | Descrição                    |
| -------- | ------------------------------------- | --------------------------- | ---------------------------- |
| `POST`   | `/v1/volumes`                         | `stock.volumes.create`      | Criar volume                 |
| `GET`    | `/v1/volumes`                         | `stock.volumes.list`        | Listar volumes               |
| `GET`    | `/v1/volumes/:volumeId`               | `stock.volumes.read`        | Obter volume por ID          |
| `PUT`    | `/v1/volumes/:volumeId`               | `stock.volumes.update`      | Atualizar volume             |
| `DELETE` | `/v1/volumes/:volumeId`               | `stock.volumes.delete`      | Excluir volume (soft delete) |
| `POST`   | `/v1/volumes/:volumeId/close`         | `stock.volumes.close`       | Fechar volume                |
| `POST`   | `/v1/volumes/:volumeId/reopen`        | `stock.volumes.reopen`      | Reabrir volume               |
| `POST`   | `/v1/volumes/:volumeId/deliver`       | `stock.volumes.deliver`     | Registrar entrega            |
| `POST`   | `/v1/volumes/:volumeId/return`        | `stock.volumes.return`      | Registrar devolução          |
| `POST`   | `/v1/volumes/:volumeId/items`         | `stock.volumes.add-item`    | Adicionar item ao volume     |
| `DELETE` | `/v1/volumes/:volumeId/items/:itemId` | `stock.volumes.remove-item` | Remover item do volume       |
| `GET`    | `/v1/volumes/:volumeId/romaneio`      | `stock.volumes.romaneio`    | Gerar romaneio (PDF/dados)   |

### Labels

| Método | Path                          | Permissão          | Descrição                        |
| ------ | ----------------------------- | ------------------ | -------------------------------- |
| `POST` | `/v1/labels/generate`         | `stock.items.read` | Gerar etiquetas para itens       |
| `POST` | `/v1/labels/generate-by-zone` | `stock.bins.read`  | Gerar etiquetas de bins por zona |
| `GET`  | `/v1/labels/preview`          | `stock.items.read` | Preview de etiqueta              |

### Care Instructions

| Método | Path       | Permissão         | Descrição                                         |
| ------ | ---------- | ----------------- | ------------------------------------------------- |
| `GET`  | `/v1/care` | `stock.care.list` | Listar opções de instruções de cuidado (ISO 3758) |

### Address Utilities

| Método | Path                   | Permissão         | Descrição               |
| ------ | ---------------------- | ----------------- | ----------------------- |
| `POST` | `/v1/address/parse`    | `stock.bins.read` | Parsear endereço de bin |
| `POST` | `/v1/address/validate` | `stock.bins.read` | Validar endereço de bin |
| `POST` | `/v1/address/suggest`  | `stock.bins.read` | Sugerir endereço de bin |

---

## Business Rules

### Regra 1: Código Hierárquico Imutável (`fullCode`)

O `fullCode` é gerado automaticamente na criação e **nunca pode ser alterado**.

- **Produto:** `{templateCode}.{manufacturerCode}.{productSequential}` — ex: `001.001.0001`
  - `{templateCode}`: 3 dígitos (ex: `001`)
  - `{manufacturerCode}`: 3 dígitos — `000` quando não há fabricante
  - `{productSequential}`: 4 dígitos com zero à esquerda
- **Variante:** `{productFullCode}.{variantSequential}` — ex: `001.001.0001.001`
  - `{variantSequential}`: 3 dígitos, sequencial **local ao produto** (não global)
- **Item:** `{variantFullCode}-{itemSequential}` — ex: `001.001.0001.001-00001`
  - `{itemSequential}`: 5 dígitos, sequencial **local à variante**

Deste `fullCode` são derivados e também imutáveis:

- `barcode` (Code128)
- `eanCode` (EAN-13)
- `upcCode` (UPC-A)
- `slug` (via `Slug.createFromText`)

### Regra 2: Transições de Status do Produto

```
DRAFT → ACTIVE → INACTIVE
              ↓
         OUT_OF_STOCK → ACTIVE
              ↓
         DISCONTINUED (terminal)
```

- Apenas produtos `ACTIVE` podem ser vendidos (`canBeSold`)
- Produtos `DISCONTINUED` não voltam para `ACTIVE`
- Produtos com `status = OUT_OF_STOCK` continuam visíveis na listagem

### Regra 3: Transições de Status do Item

```
AVAILABLE ↔ RESERVED
AVAILABLE → IN_TRANSIT
AVAILABLE → DAMAGED
AVAILABLE → EXPIRED
AVAILABLE → DISPOSED
```

- Apenas itens `AVAILABLE` podem ser vendidos ou reservados
- Itens `EXPIRED` e `DAMAGED` requerem ação do usuário
- Itens `DISPOSED` são terminais (não voltam para `AVAILABLE`)

### Regra 4: Movimentações que Requerem Aprovação

Os tipos `LOSS` e `INVENTORY_ADJUSTMENT` têm `requiresApproval = true`.

- O registro da movimentação é criado normalmente
- O campo `approvedBy` fica nulo até aprovação explícita
- A aprovação é registrada via `movement.approve(approverId)`
- Um movimento já aprovado não pode ser aprovado novamente

### Regra 5: Quantidade do Item

- `currentQuantity` **nunca pode ser negativa** — validação na camada de entidade
- `removeQuantity(amount)` lança erro se `amount > currentQuantity`
- `addQuantity(amount)` lança erro se `amount <= 0`

### Regra 6: Bloqueio de Bin

- Um bin bloqueado (`isBlocked = true`) não pode receber novos itens
- O desbloqueio limpa automaticamente o `blockReason`
- Bins bloqueados não aparecem nas listagens de bins disponíveis

### Regra 7: Ocupação de Bin

- Quando um item tem `binId` definido, `bin.currentOccupancy` é incrementado
- Quando o item é removido do bin, a ocupação é decrementada
- Se `bin.capacity` está definido e `currentOccupancy >= capacity`, o bin é marcado como `isFull`
- `bin.isFull` impede que novos itens sejam alocados nele

### Regra 8: `lastKnownAddress`

- Quando o `binId` de um item é removido (item saiu do bin), o endereço do bin anterior é preservado em `lastKnownAddress`
- Isso garante rastreabilidade mesmo após o item ser desvinculado do endereço físico

### Regra 9: Fluxo do Pedido de Compra

```
PENDING → CONFIRMED → DELIVERED (terminal)
        ↘              ↓
         CANCELLED   (CANCELLED a partir de qualquer não-final)
         (terminal)
```

- Apenas pedidos `PENDING` podem ser confirmados
- Apenas pedidos `CONFIRMED` podem ser recebidos (`receive()`)
- Pedidos `DELIVERED` ou `CANCELLED` não podem ser cancelados
- A recepção (`receive()`) define automaticamente `receivedDate = now()`
- Itens só podem ser adicionados/removidos em pedidos modificáveis (`status.canBeModified`)

### Regra 10: Fluxo do Volume

```
OPEN → CLOSED → DELIVERED → RETURNED
       ↓
     REOPEN → OPEN
```

- Apenas volumes `OPEN` aceitam adição/remoção de itens
- Volumes `CLOSED` podem ser reabertos
- O romaneio é gerado a partir do volume `CLOSED` ou `DELIVERED`
- `closedAt`, `deliveredAt`, `returnedAt` são registrados automaticamente na transição

### Regra 11: Slug Único por Tenant

- O slug é único por tenant no escopo de registros não deletados (`deletedAt IS NULL`)
- Isso permite que um registro deletado tenha seu slug reutilizado por um novo registro
- O índice composto é: `[slug, tenantId, deletedAt]`

### Regra 12: Unicidade de Código de Fabricante

- O código de 3 dígitos do fabricante é único por tenant
- É o segundo segmento do `fullCode` do produto
- Quando um produto não tem fabricante, usa-se `000` como código no `fullCode`

---

## Permissions

| Código                                   | Descrição                                       |
| ---------------------------------------- | ----------------------------------------------- |
| `stock.products.create`                  | Criar produto                                   |
| `stock.products.read`                    | Visualizar produto                              |
| `stock.products.update`                  | Editar produto                                  |
| `stock.products.delete`                  | Excluir produto                                 |
| `stock.products.list`                    | Listar produtos                                 |
| `stock.products.request`                 | Solicitar alteração de produto                  |
| `stock.products.approve`                 | Aprovar alteração de produto                    |
| `stock.products.manage`                  | Gerenciamento completo de produtos              |
| `stock.variants.create`                  | Criar variante                                  |
| `stock.variants.read`                    | Visualizar variante                             |
| `stock.variants.update`                  | Editar variante                                 |
| `stock.variants.delete`                  | Excluir variante                                |
| `stock.variants.list`                    | Listar variantes                                |
| `stock.variants.request`                 | Solicitar alteração de variante                 |
| `stock.variants.approve`                 | Aprovar alteração de variante                   |
| `stock.variants.manage`                  | Gerenciamento completo de variantes             |
| `stock.items.create`                     | Criar item                                      |
| `stock.items.read`                       | Visualizar item                                 |
| `stock.items.update`                     | Editar item                                     |
| `stock.items.delete`                     | Excluir item                                    |
| `stock.items.list`                       | Listar itens                                    |
| `stock.items.entry`                      | Registrar entrada de itens                      |
| `stock.items.exit`                       | Registrar saída de itens                        |
| `stock.items.transfer`                   | Transferir item entre localizações              |
| `stock.items.request`                    | Solicitar movimentação                          |
| `stock.items.approve`                    | Aprovar movimentação                            |
| `stock.items.manage`                     | Gerenciamento completo de itens                 |
| `stock.movements.create`                 | Criar movimentação                              |
| `stock.movements.read`                   | Visualizar movimentação                         |
| `stock.movements.list`                   | Listar movimentações                            |
| `stock.movements.approve`                | Aprovar movimentação                            |
| `stock.suppliers.create`                 | Criar fornecedor                                |
| `stock.suppliers.read`                   | Visualizar fornecedor                           |
| `stock.suppliers.update`                 | Editar fornecedor                               |
| `stock.suppliers.delete`                 | Excluir fornecedor                              |
| `stock.suppliers.list`                   | Listar fornecedores                             |
| `stock.suppliers.manage`                 | Gerenciamento completo de fornecedores          |
| `stock.manufacturers.create`             | Criar fabricante                                |
| `stock.manufacturers.read`               | Visualizar fabricante                           |
| `stock.manufacturers.update`             | Editar fabricante                               |
| `stock.manufacturers.delete`             | Excluir fabricante                              |
| `stock.manufacturers.list`               | Listar fabricantes                              |
| `stock.manufacturers.manage`             | Gerenciamento completo de fabricantes           |
| `stock.warehouses.create`                | Criar armazém                                   |
| `stock.warehouses.read`                  | Visualizar armazém                              |
| `stock.warehouses.update`                | Editar armazém                                  |
| `stock.warehouses.delete`                | Excluir armazém                                 |
| `stock.warehouses.list`                  | Listar armazéns                                 |
| `stock.warehouses.manage`                | Gerenciamento completo de armazéns              |
| `stock.zones.create`                     | Criar zona                                      |
| `stock.zones.read`                       | Visualizar zona                                 |
| `stock.zones.update`                     | Editar zona                                     |
| `stock.zones.delete`                     | Excluir zona                                    |
| `stock.zones.list`                       | Listar zonas                                    |
| `stock.zones.configure`                  | Configurar estrutura e layout de zona           |
| `stock.zones.manage`                     | Gerenciamento completo de zonas                 |
| `stock.bins.read`                        | Visualizar bin                                  |
| `stock.bins.update`                      | Editar bin                                      |
| `stock.bins.list`                        | Listar bins                                     |
| `stock.bins.search`                      | Buscar bins por endereço                        |
| `stock.bins.manage`                      | Bloquear/desbloquear bins                       |
| `stock.categories.create`                | Criar categoria                                 |
| `stock.categories.read`                  | Visualizar categoria                            |
| `stock.categories.update`                | Editar categoria                                |
| `stock.categories.delete`                | Excluir categoria                               |
| `stock.categories.list`                  | Listar categorias                               |
| `stock.categories.manage`                | Gerenciamento completo de categorias            |
| `stock.tags.create`                      | Criar tag                                       |
| `stock.tags.read`                        | Visualizar tag                                  |
| `stock.tags.update`                      | Editar tag                                      |
| `stock.tags.delete`                      | Excluir tag                                     |
| `stock.tags.list`                        | Listar tags                                     |
| `stock.tags.manage`                      | Gerenciamento completo de tags                  |
| `stock.templates.create`                 | Criar template                                  |
| `stock.templates.read`                   | Visualizar template                             |
| `stock.templates.update`                 | Editar template                                 |
| `stock.templates.delete`                 | Excluir template                                |
| `stock.templates.list`                   | Listar templates                                |
| `stock.templates.manage`                 | Gerenciamento completo de templates             |
| `stock.product-care-instructions.create` | Adicionar instrução de cuidado                  |
| `stock.product-care-instructions.read`   | Visualizar instruções de cuidado                |
| `stock.product-care-instructions.delete` | Remover instrução de cuidado                    |
| `stock.product-attachments.create`       | Adicionar anexo de produto                      |
| `stock.product-attachments.read`         | Visualizar anexos de produto                    |
| `stock.product-attachments.delete`       | Remover anexo de produto                        |
| `stock.variant-attachments.create`       | Adicionar anexo de variante                     |
| `stock.variant-attachments.read`         | Visualizar anexos de variante                   |
| `stock.variant-attachments.delete`       | Remover anexo de variante                       |
| `stock.purchase-orders.create`           | Criar pedido de compra                          |
| `stock.purchase-orders.read`             | Visualizar pedido de compra                     |
| `stock.purchase-orders.update`           | Editar pedido de compra                         |
| `stock.purchase-orders.delete`           | Excluir pedido de compra                        |
| `stock.purchase-orders.list`             | Listar pedidos de compra                        |
| `stock.purchase-orders.approve`          | Aprovar pedido de compra                        |
| `stock.purchase-orders.cancel`           | Cancelar pedido de compra                       |
| `stock.purchase-orders.manage`           | Gerenciamento completo de pedidos               |
| `stock.care.read`                        | Visualizar opções de cuidado                    |
| `stock.care.list`                        | Listar opções de cuidado                        |
| `stock.care.set`                         | Definir instruções de cuidado                   |
| `stock.volumes.create`                   | Criar volume                                    |
| `stock.volumes.read`                     | Visualizar volume                               |
| `stock.volumes.update`                   | Editar volume                                   |
| `stock.volumes.delete`                   | Excluir volume                                  |
| `stock.volumes.list`                     | Listar volumes                                  |
| `stock.volumes.manage`                   | Gerenciamento completo de volumes               |
| `stock.volumes.close`                    | Fechar volume                                   |
| `stock.volumes.reopen`                   | Reabrir volume                                  |
| `stock.volumes.deliver`                  | Registrar entrega de volume                     |
| `stock.volumes.return`                   | Registrar devolução de volume                   |
| `stock.volumes.add-item`                 | Adicionar item a volume                         |
| `stock.volumes.remove-item`              | Remover item de volume                          |
| `stock.volumes.romaneio`                 | Gerar romaneio                                  |
| `stock.locations.create`                 | Criar localização (legado)                      |
| `stock.locations.read`                   | Visualizar localização (legado)                 |
| `stock.locations.update`                 | Editar localização (legado)                     |
| `stock.locations.delete`                 | Excluir localização (legado)                    |
| `stock.locations.list`                   | Listar localizações (legado)                    |
| `stock.locations.manage`                 | Gerenciamento completo de localizações (legado) |

---

## Data Model

### Hierarquia de Estoque

```
Template (001)
└── Product (001.001.0001)
    ├── ProductCategory → Category (hierárquica)
    ├── ProductTag → Tag
    ├── ProductCareInstruction
    ├── ProductAttachment
    └── Variant (001.001.0001.001)
        ├── VariantImage
        ├── VariantPriceHistory
        ├── VariantAttachment
        ├── VariantSupplierCode
        └── Item (001.001.0001.001-00001)
            ├── ItemMovement
            ├── ItemReservation
            └── VolumeItem → Volume
```

### Sistema de Localização

```
Warehouse (FAB)
└── Zone (FAB-EST)
    └── Bin (FAB-EST-102-B)
        └── Item[]
```

### Pedidos de Compra

```
Supplier
└── PurchaseOrder
    └── PurchaseOrderItem → Variant
```

### Modelos Prisma — Enums do Módulo

```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  INACTIVE
  DISCONTINUED
  OUT_OF_STOCK
}

enum ItemStatus {
  AVAILABLE
  RESERVED
  IN_TRANSIT
  DAMAGED
  EXPIRED
  DISPOSED
}

enum MovementType {
  PURCHASE
  CUSTOMER_RETURN
  SALE
  PRODUCTION
  SAMPLE
  LOSS
  SUPPLIER_RETURN
  TRANSFER
  INVENTORY_ADJUSTMENT
  ZONE_RECONFIGURE
}

enum VolumeStatus {
  OPEN
  CLOSED
  DELIVERED
  RETURNED
}

enum UnitOfMeasure {
  UNITS
  METERS
  KILOGRAMS
  GRAMS
  LITERS
  MILLILITERS
  SQUARE_METERS
  PAIRS
  BOXES
  PACKS
}
```

### Indexes Críticos

| Tabela           | Índice                                                 | Finalidade                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------- |
| `products`       | `(full_code)` UNIQUE                                   | Unicidade global do código            |
| `products`       | `(barcode)` UNIQUE                                     | Busca por código de barras            |
| `products`       | `(ean_code)` UNIQUE                                    | Busca por EAN-13                      |
| `variants`       | `(full_code)` UNIQUE                                   | Unicidade global do código            |
| `items`          | `(full_code)` UNIQUE                                   | Unicidade global do código            |
| `items`          | `(variant_id, bin_id)`                                 | Itens por variante em determinado bin |
| `items`          | `(expiry_date, deleted_at)`                            | Busca de itens próximos ao vencimento |
| `bins`           | `(address, tenant_id, deleted_at)` UNIQUE              | Unicidade de endereço por tenant      |
| `bins`           | `(zone_id, aisle, shelf, position, deleted_at)` UNIQUE | Unicidade de posição por zona         |
| `item_movements` | `(item_id, created_at)`                                | Histórico de movimentações            |
| `warehouses`     | `(code, tenant_id, deleted_at)` UNIQUE                 | Unicidade de código por tenant        |
| `zones`          | `(warehouse_id, code, deleted_at)` UNIQUE              | Unicidade de código por armazém       |

---

## Use Cases

### Templates

- `CreateTemplateUseCase`
- `ListTemplatesUseCase`
- `GetTemplateByIdUseCase`
- `UpdateTemplateUseCase`
- `DeleteTemplateUseCase`

### Products

- `CreateProductUseCase`
- `ListProductsUseCase`
- `GetProductByIdUseCase`
- `UpdateProductUseCase`
- `DeleteProductUseCase`

### Variants

- `CreateVariantUseCase`
- `ListVariantsUseCase`
- `ListVariantsByProductIdUseCase`
- `GetVariantByIdUseCase`
- `UpdateVariantUseCase`
- `DeleteVariantUseCase`

### Items

- `RegisterItemEntryUseCase`
- `RegisterItemExitUseCase`
- `TransferItemUseCase`
- `BatchTransferItemsUseCase`
- `ListItemsUseCase`
- `ListItemsByProductIdUseCase`
- `ListItemsByVariantIdUseCase`
- `ListItemsByBinIdUseCase`
- `GetItemByIdUseCase`
- `GetItemLocationHistoryUseCase`
- `GetItemsLabelDataUseCase`

### Item Movements

- `ListItemMovementsUseCase`

### Warehouses

- `CreateWarehouseUseCase`
- `ListWarehousesUseCase`
- `GetWarehouseByIdUseCase`
- `UpdateWarehouseUseCase`
- `DeleteWarehouseUseCase`

### Zones

- `CreateZoneUseCase`
- `ListZonesUseCase`
- `GetZoneByIdUseCase`
- `UpdateZoneUseCase`
- `DeleteZoneUseCase`
- `ConfigureZoneStructureUseCase`
- `PreviewZoneStructureUseCase`
- `PreviewZoneReconfigurationUseCase`
- `UpdateZoneLayoutUseCase`
- `ResetZoneLayoutUseCase`
- `GetZoneItemStatsUseCase`

### Bins

- `ListBinsUseCase`
- `ListAvailableBinsUseCase`
- `SearchBinsUseCase`
- `GetBinByIdUseCase`
- `GetBinByAddressUseCase`
- `GetBinDetailUseCase`
- `GetBinOccupancyMapUseCase`
- `UpdateBinUseCase`
- `BlockBinUseCase`
- `UnblockBinUseCase`

### Suppliers

- `CreateSupplierUseCase`
- `ListSuppliersUseCase`
- `GetSupplierByIdUseCase`
- `UpdateSupplierUseCase`
- `DeleteSupplierUseCase`

### Manufacturers

- `CreateManufacturerUseCase`
- `ListManufacturersUseCase`
- `GetManufacturerByIdUseCase`
- `UpdateManufacturerUseCase`
- `DeleteManufacturerUseCase`

### Categories

- `CreateCategoryUseCase`
- `ListCategoriesUseCase`
- `GetCategoryByIdUseCase`
- `UpdateCategoryUseCase`
- `DeleteCategoryUseCase`
- `ReorderCategoriesUseCase`

### Tags

- `CreateTagUseCase`
- `ListTagsUseCase`
- `GetTagByIdUseCase`
- `UpdateTagUseCase`
- `DeleteTagUseCase`

### Purchase Orders

- `CreatePurchaseOrderUseCase`
- `ListPurchaseOrdersUseCase`
- `GetPurchaseOrderByIdUseCase`
- `CancelPurchaseOrderUseCase`

### Volumes

- `CreateVolumeUseCase`
- `ListVolumesUseCase`
- `GetVolumeByIdUseCase`
- `UpdateVolumeUseCase`
- `DeleteVolumeUseCase`
- `CloseVolumeUseCase`
- `ReopenVolumeUseCase`
- `DeliverVolumeUseCase`
- `ReturnVolumeUseCase`
- `AddItemToVolumeUseCase`
- `RemoveItemFromVolumeUseCase`
- `GetRomaneioUseCase`

### Labels

- `GenerateLabelsUseCase`
- `GenerateLabelsByZoneUseCase`
- `GetLabelPreviewUseCase`

### Care Instructions

- `ListCareOptionsUseCase`

### Address Utilities

- `ParseAddressUseCase`
- `ValidateAddressUseCase`
- `SuggestAddressUseCase`

---

## Repositories

| Interface                           | Arquivo                                                          | Implementações   |
| ----------------------------------- | ---------------------------------------------------------------- | ---------------- |
| `ProductsRepository`                | `src/repositories/stock/products-repository.ts`                  | Prisma, InMemory |
| `VariantsRepository`                | `src/repositories/stock/variants-repository.ts`                  | Prisma, InMemory |
| `ItemsRepository`                   | `src/repositories/stock/items-repository.ts`                     | Prisma, InMemory |
| `ItemMovementsRepository`           | `src/repositories/stock/item-movements-repository.ts`            | Prisma, InMemory |
| `TemplatesRepository`               | `src/repositories/stock/templates-repository.ts`                 | Prisma, InMemory |
| `WarehousesRepository`              | `src/repositories/stock/warehouses-repository.ts`                | Prisma, InMemory |
| `ZonesRepository`                   | `src/repositories/stock/zones-repository.ts`                     | Prisma, InMemory |
| `BinsRepository`                    | `src/repositories/stock/bins-repository.ts`                      | Prisma, InMemory |
| `SuppliersRepository`               | `src/repositories/stock/suppliers-repository.ts`                 | Prisma, InMemory |
| `ManufacturersRepository`           | `src/repositories/stock/manufacturers-repository.ts`             | Prisma, InMemory |
| `CategoriesRepository`              | `src/repositories/stock/categories-repository.ts`                | Prisma, InMemory |
| `TagsRepository`                    | `src/repositories/stock/tags-repository.ts`                      | Prisma, InMemory |
| `PurchaseOrdersRepository`          | `src/repositories/stock/purchase-orders-repository.ts`           | Prisma, InMemory |
| `VolumesRepository`                 | `src/repositories/stock/volumes-repository.ts`                   | Prisma, InMemory |
| `ProductCareInstructionsRepository` | `src/repositories/stock/product-care-instructions-repository.ts` | Prisma, InMemory |
| `ProductAttachmentsRepository`      | `src/repositories/stock/product-attachments-repository.ts`       | Prisma, InMemory |

Todos os repositórios seguem o padrão:

- `create(data)` — insere o registro
- `findById(id, tenantId)` — busca por ID com isolamento de tenant
- `findMany(params)` — busca paginada com filtros
- `save(entity)` — persiste alterações (update)
- `delete(id, tenantId)` — soft delete (quando aplicável)

---

## Tests

- **Testes unitários:** presentes em `src/use-cases/stock/*/` como arquivos `*.spec.ts`, utilizando repositórios in-memory
- **Testes E2E:** presentes em `src/http/controllers/stock/*/` como arquivos `*.e2e.spec.ts`, utilizando banco real

### Subdomínios com cobertura E2E confirmada

| Subdomínio      | Arquivos E2E                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Products        | create, delete, get-by-id, list, update                                                                                                  |
| Variants        | list-by-product, get-by-id                                                                                                               |
| Items           | get-by-id, list, list-by-product, list-by-variant, register-entry, register-exit, transfer, batch-transfer, location-history, label-data |
| Warehouses      | create, delete, get-by-id, list, update                                                                                                  |
| Zones           | —                                                                                                                                        |
| Bins            | block, get-by-address, get-by-id, get-detail, occupancy-map, list-available, list, search, unblock, update                               |
| Suppliers       | create, delete, get-by-id, list, update                                                                                                  |
| Manufacturers   | create, delete, get-by-id, list, update                                                                                                  |
| Categories      | create, delete, get-by-id, list, update, reorder                                                                                         |
| Tags            | create, delete, get-by-id, list, update                                                                                                  |
| Volumes         | create, list, add-item, close, delete, deliver, get-by-id, get-romaneio, remove-item, reopen, return, update                             |
| Purchase Orders | —                                                                                                                                        |
| Items (unit)    | list-by-bin-id                                                                                                                           |
| Bins (unit)     | get-detail, occupancy-map, list-available, search                                                                                        |

### Factories de Teste

Factories de teste E2E podem ser encontradas em `src/utils/tests/factories/`.

---

## Relationships Diagram

```
UnitOfMeasure
│
Template ─────────────────────────────────────────┐
│   code (001)                                     │
│                                                  │
└── Product (001.001.0001)                         │
    │   fullCode, barcode, eanCode, upcCode        │
    │   slug (imutável)                             │
    ├── N→1 Template ──────────────────────────────┘
    ├── N→1 Supplier (opcional)
    ├── N→1 Manufacturer (opcional, code → segment)
    ├── N→1 Organization (opcional)
    ├── N→N Category (via ProductCategory)
    ├── N→N Tag (via ProductTag)
    ├── 1→N ProductCareInstruction
    ├── 1→N ProductAttachment
    └── Variant (001.001.0001.001)
        │   fullCode, barcode, eanCode, upcCode
        │   slug (imutável)
        ├── 1→N VariantImage
        ├── 1→N VariantPriceHistory
        ├── 1→N VariantAttachment
        ├── N→N PurchaseOrderItem → PurchaseOrder → Supplier
        └── Item (001.001.0001.001-00001)
            │   fullCode, barcode, eanCode, upcCode
            │   slug (imutável)
            ├── N→1 Bin (opcional)
            │       N→1 Zone
            │               N→1 Warehouse
            ├── 1→N ItemMovement → User
            ├── 1→N ItemReservation
            └── N→N Volume (via VolumeItem)
```

---

## Melhorias Recentes (Audit mar 2026)

### Paginação Padronizada

Seis endpoints de listagem foram padronizados com `paginationSchema` (query params `page` e `limit`), retornando `{ data, meta: { total, page, limit, pages } }`:

| Endpoint                              | Controller                                  | Filtros adicionais                             |
| ------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `GET /v1/items`                       | `v1-list-items.controller.ts`               | `variantId`, `binId`, `productId`, `status`    |
| `GET /v1/items/by-product/:productId` | `v1-list-items-by-product-id.controller.ts` | `status`                                       |
| `GET /v1/items/by-variant/:variantId` | `v1-list-items-by-variant-id.controller.ts` | `status`                                       |
| `GET /v1/products`                    | `v1-list-products.controller.ts`            | `search`, `templateId`, `categoryId`, `status` |
| `GET /v1/variants`                    | `v1-list-variants.controller.ts`            | `productId`, `search`                          |
| `GET /v1/item-movements`              | `v1-list-item-movements.controller.ts`      | `itemId`, `type`, `startDate`, `endDate`       |

### Transaction Safety

Os seguintes use cases utilizam `TransactionManager` para garantir atomicidade em operações multi-step:

| Use Case                 | Arquivo                             | Motivo                                    |
| ------------------------ | ----------------------------------- | ----------------------------------------- |
| `ReorderCategories`      | `categories/reorder-categories.ts`  | Atualiza posições de múltiplas categorias |
| `BatchTransferItems`     | `items/batch-transfer-items.ts`     | Movimenta múltiplos itens entre bins      |
| `RegisterItemEntry`      | `items/register-item-entry.ts`      | Cria item + movimentação de entrada       |
| `RegisterItemExit`       | `items/register-item-exit.ts`       | Atualiza item + movimentação de saída     |
| `TransferItem`           | `items/transfer-item.ts`            | Movimenta item entre bins com histórico   |
| `DeleteProduct`          | `products/delete-product.ts`        | Soft-delete cascata (variantes, itens)    |
| `ConfigureZoneStructure` | `zones/configure-zone-structure.ts` | Cria/remove bins em batch                 |
| `DeleteZone`             | `zones/delete-zone.ts`              | Remove zona + desvincula itens            |

Padrão: repositórios aceitam `tx?: TransactionClient` opcional; factories injetam `PrismaTransactionManager`.

### Performance — Fix N+1

- `detachItemsFromBins` no `PrismaItemsRepository` foi refatorado para usar `updateMany` em vez de loop individual, eliminando N+1 queries ao desvincular itens de bins.

### Cobertura de Testes E2E

Testes expandidos no commit `e8bfee4`:

- **Product Care Instructions**: 3 novos arquivos E2E (create, delete, list) com validação de permissões e payloads
- **Multi-tenant isolation**: `v1-stock-multi-tenant-isolation.e2e.spec.ts` expandido com cobertura para warehouses, volumes, care instructions e manufacturers
- **Error scenarios (404)**: ~15 endpoints de get/update/delete receberam testes de "recurso não encontrado" com asserção de `404` status

### Error i18n e Audit Logging

- Mensagens de erro em use cases sensíveis foram traduzidas para PT-BR
- Operações críticas (movimentações, exclusões, transferências) registram audit log via `queueAuditLog`

---

## Audit History

| Date       | Dimension                                      | Score | Report                                                                             |
| ---------- | ---------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| 2026-03-11 | Data Integrity + Business Rules + E2E Coverage | —     | Audit de 6 fases: paginação, transações, state guards, N+1, testes E2E, error i18n |
