# Pattern: Mapper

## Problem

A aplicação opera em três representações distintas para cada entidade de negócio:

1. **Registro Prisma** — estrutura retornada pelo banco de dados (snake_case via `@map()`, campos nullable com `null`, tipos decimais como `Decimal`, JSONs sem tipagem).
2. **Entidade de domínio** — objeto rico em lógica, com Value Objects tipados (`UniqueEntityID`, `ProductStatus`, `CPF`, `Url`, `Slug`, etc.) e propriedades validadas pelo construtor.
3. **DTO de resposta** — objeto plano e serializável enviado como JSON pela API (todos os IDs como `string`, Value Objects "abertos", campos opcionais omitidos quando ausentes).

Converter diretamente entre essas camadas dentro de use cases ou controllers cria acoplamento, duplicação e quebra o princípio de responsabilidade única. O padrão Mapper isola essas conversões em funções puras e dedicadas.

---

## Solution

Cada entidade possui um diretório próprio em `src/mappers/{module}/{entity}/` com, no mínimo, dois arquivos:

| Arquivo | Direção | Assinatura padrão |
|---------|---------|-------------------|
| `{entity}-prisma-to-domain.ts` | Prisma → Domínio | `{entity}PrismaToDomain(raw) → Entity` |
| `{entity}-to-dto.ts` | Domínio → DTO | `{entity}ToDTO(entity) → EntityDTO` |

Alguns módulos (como `hr/organization`) possuem um terceiro arquivo:

| Arquivo | Direção | Assinatura padrão |
|---------|---------|-------------------|
| `{entity}-domain-to-prisma.ts` | Domínio → Prisma | `map{Entity}DomainToPrisma(entity) → PrismaInput` |

O fluxo completo de dados na aplicação é:

```
PostgreSQL (Prisma)
       │
       │  {entity}-prisma-to-domain.ts
       ▼
Entidade de Domínio (com Value Objects)
       │
       │  {entity}-to-dto.ts
       ▼
DTO (JSON serializável) → HTTP Response
```

Na escrita (criação/atualização), o repositório Prisma recebe campos extraídos diretamente da entidade ou, em casos avançados, utiliza um mapper Domínio → Prisma.

---

## Directory Structure

```
src/mappers/
  core/
    user/
      user-profile-prisma-to-domain.ts
      user-profile-to-dto.ts
    session/
      session-to-dto.ts
    refresh-token/
      refresh-token-prisma-to-domain.ts
      refresh-token-to-dto.ts
    label-template/
      label-template-prisma-to-domain.ts
      label-template-to-dto.ts
    tenant/
      tenant-to-dto.ts
      tenant-user-to-dto.ts
      plan-to-dto.ts
      ...
  stock/
    product/
      product-prisma-to-domain.ts   ← mapProductPrismaToDomain + productPrismaToDomain
      product-to-dto.ts             ← ProductDTO (interface) + productToDTO
    variant/
      variant-prisma-to-domain.ts
    item/
      item-prisma-to-domain.ts
    purchase-order/
      purchase-order-prisma-to-domain.ts
    volume.mapper.ts                ← VolumeMapper (classe estática, padrão alternativo)
    ...
  hr/
    employee/
      employee-prisma-to-domain.ts
      employee-to-dto.ts
      index.ts                      ← re-exporta tudo do diretório
    company/
      company-prisma-to-domain.ts
      company-to-dto.ts             ← CompanyDTO + CompanyWithDetailsDTO
    organization/
      company-organization-prisma-to-domain.ts
      company-organization-domain-to-prisma.ts  ← mapper de escrita
      supplier-organization-prisma-to-domain.ts
      supplier-organization-domain-to-prisma.ts
      manufacturer-organization-prisma-to-domain.ts
      manufacturer-organization-domain-to-prisma.ts
    ...
  sales/
    customer/
      customer-prisma-to-domain.ts
      customer-to-dto.ts
    ...
  finance/
    finance-entry/
      finance-entry-prisma-to-domain.ts
      finance-entry-to-dto.ts
    ...
  storage/
    storage-file/
      storage-file-prisma-to-domain.ts
    ...
  rbac/
    permission-prisma-to-domain.ts
  requests/
    request-mapper.ts               ← RequestMapper (classe estática, padrão alternativo)
```

Módulos com muitos sub-entidades (como `hr`) possuem um `index.ts` em cada subpasta que re-exporta todos os símbolos, e um `hr/index.ts` que re-exporta todos os subdiretórios.

---

## Implementation

### 1. Mapper Prisma → Domínio (padrão de duas funções)

O padrão mais comum separa o mapeamento em duas funções:

- `map{Entity}PrismaToDomain` — retorna um objeto com as props brutas (útil para composição e testes).
- `{entity}PrismaToDomain` — chama a primeira e invoca `Entity.create(props, id)` retornando a instância completa.

**Exemplo real — `src/mappers/stock/product/product-prisma-to-domain.ts`:**

```typescript
// Tipo auxiliar: PrismaProduct + relações opcionais (eager loading variável)
type ProductWithRelations = PrismaProduct & {
  template?: PrismaTemplate;
  supplier?: PrismaSupplier | null;
  manufacturer?: PrismaManufacturer | null;
  organization?: PrismaOrganization | null;
  variants?: PrismaVariant[];
  productCategories?: Array<{ category: PrismaCategoryWithCount }>;
  productTags?: Array<{ tag: PrismaTag }>;
};

// Função intermediária — retorna props puras (sem instanciar a entidade)
export function mapProductPrismaToDomain(productDb: ProductWithRelations) {
  const slug =
    productDb.slug && productDb.slug.trim()
      ? Slug.create(productDb.slug)
      : Slug.createFromText(productDb.name || 'product');

  return {
    id: new UniqueEntityID(productDb.id),           // string → Value Object
    tenantId: new UniqueEntityID(productDb.tenantId),
    name: productDb.name,
    slug: slug,                                      // string → Slug (Value Object)
    status: ProductStatus.create(productDb.status), // string → ProductStatus
    barcode: productDb.barcode ?? '',               // null → string vazia
    supplierId: productDb.supplierId
      ? new UniqueEntityID(productDb.supplierId)
      : undefined,                                   // null → undefined
    // Relações opcionais: mapeadas recursivamente quando presentes
    supplier: productDb.supplier
      ? supplierPrismaToDomain(productDb.supplier)
      : undefined,
    variants: productDb.variants
      ? productDb.variants.map(variantPrismaToDomain)
      : undefined,
    productCategories: productDb.productCategories
      ? productDb.productCategories.map((pc) => ({
          category: categoryPrismaToDomain(pc.category),
        }))
      : undefined,
    createdAt: productDb.createdAt,
    updatedAt: productDb.updatedAt ?? undefined,
    deletedAt: productDb.deletedAt ?? undefined,
  };
}

// Função pública — instancia a entidade de domínio completa
export function productPrismaToDomain(productDb: ProductWithRelations): Product {
  return Product.create(
    mapProductPrismaToDomain(productDb),
    new UniqueEntityID(productDb.id),
  );
}
```

**Exemplo simplificado — `src/mappers/stock/item/item-prisma-to-domain.ts`:**

```typescript
export function mapItemPrismaToDomain(itemDb: PrismaItem) {
  const slug =
    itemDb.slug && itemDb.slug.trim()
      ? Slug.create(itemDb.slug)
      : Slug.createFromText('item');

  return {
    id: new UniqueEntityID(itemDb.id),
    tenantId: new UniqueEntityID(itemDb.tenantId),
    variantId: new UniqueEntityID(itemDb.variantId),
    // Conversão de Decimal (Prisma) → number (domínio)
    initialQuantity: Number(itemDb.initialQuantity.toString()),
    currentQuantity: Number(itemDb.currentQuantity.toString()),
    unitCost: itemDb.unitCost ? Number(itemDb.unitCost.toString()) : undefined,
    status: ItemStatus.create(itemDb.status),       // enum string → Value Object
    attributes: itemDb.attributes as Record<string, unknown>, // JSON → tipagem
    createdAt: itemDb.createdAt,
    updatedAt: itemDb.updatedAt,
    deletedAt: itemDb.deletedAt ?? undefined,
  };
}

export function itemPrismaToDomain(itemDb: PrismaItem): Item {
  return Item.create(mapItemPrismaToDomain(itemDb), new UniqueEntityID(itemDb.id));
}
```

---

### 2. Mapper Domínio → DTO

O arquivo `{entity}-to-dto.ts` declara a interface do DTO e a função de conversão. A interface documenta exatamente o que a API retorna.

**Regras de conversão aplicadas:**

| Tipo no Domínio | Tipo no DTO | Conversão |
|-----------------|-------------|-----------|
| `UniqueEntityID` | `string` | `.toString()` |
| Value Object (ex: `ProductStatus`) | `string` | `.value` |
| Value Object (ex: `Url`, `CPF`) | `string` | `.toString()` ou `.value` |
| `Date` | `Date` | direto (serializado pelo Fastify) |
| `Date` em alguns DTOs de HR | `string` | `.toISOString()` |
| `undefined` | omitido do objeto | atribuição condicional |
| Entidade relacionada | Sub-DTO aninhado | chamada à função auxiliar interna |

**Exemplo — `src/mappers/stock/product/product-to-dto.ts`:**

```typescript
// Interface DTO: tipos primitivos, sem Value Objects
export interface ProductDTO {
  id: string;
  name: string;
  status: string;          // ProductStatus → string via .value
  outOfLine: boolean;
  attributes: Record<string, unknown>;
  templateId: string;
  template?: TemplateDTO;  // entidade aninhada → DTO aninhado
  supplierId?: string;
  supplier?: SupplierDTO | null;
  variants?: VariantDTO[];
  productCategories?: CategoryDTO[];
  productTags?: TagDTO[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// Função auxiliar interna (não exportada) para sub-entidades
function variantToDTO(variant: Variant): VariantDTO {
  return {
    id: variant.id.toString(),
    name: variant.name,
    price: variant.price,
    costPrice: variant.costPrice,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
}

// Função pública principal
export function productToDTO(product: Product): ProductDTO {
  return {
    id: product.id.toString(),             // UniqueEntityID → string
    name: product.name,
    status: product.status.value,          // ProductStatus → 'ACTIVE' | 'DRAFT' | ...
    outOfLine: product.outOfLine,
    attributes: product.attributes,
    templateId: product.templateId.toString(),
    template: templateToDTO(product.template),
    supplierId: product.supplierId?.toString(),  // optional chaining em IDs opcionais
    supplier: supplierToDTO(product.supplier),
    variants: product.variants?.map(variantToDTO),
    productCategories: product.categories?.map(categoryToDTO),
    productTags: product.tags?.map(tagToDTO),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
  };
}
```

**Exemplo com campos omitidos condicionalmente — `src/mappers/sales/customer/customer-to-dto.ts`:**

```typescript
export function customerToDTO(customer: Customer): CustomerDTO {
  // Inicia com campos obrigatórios
  const dto: CustomerDTO = {
    id: customer.id.toString(),
    name: customer.name,
    type: customer.type.value,         // CustomerType Value Object → string
    isActive: customer.isActive,
    createdAt: customer.createdAt,
  };

  // Adiciona campos opcionais apenas quando presentes (evita `undefined` no JSON)
  if (customer.document?.value) dto.document = customer.document.value;
  if (customer.email) dto.email = customer.email;
  if (customer.phone) dto.phone = customer.phone;
  if (customer.updatedAt) dto.updatedAt = customer.updatedAt;
  if (customer.deletedAt) dto.deletedAt = customer.deletedAt;

  return dto;
}
```

---

### 3. Mapper Domínio → Prisma (escrita)

Utilizado por repositórios que precisam compor o payload de criação/atualização. Comum em entidades com polimorfismo armazenado em `typeSpecificData` (JSON).

**Exemplo — `src/mappers/hr/organization/supplier-organization-domain-to-prisma.ts`:**

```typescript
export function mapSupplierOrganizationDomainToPrisma(supplier: Supplier) {
  return {
    type: 'SUPPLIER' as const,          // discriminador de tipo polimórfico
    legalName: supplier.legalName,
    cnpj: supplier.cnpj ?? null,        // undefined → null (Prisma exige null, não undefined)
    tradeName: supplier.tradeName ?? null,
    status: supplier.status,
    typeSpecificData: {                  // dados específicos do subtipo em JSON
      paymentTerms: supplier.paymentTerms ?? null,
      rating: supplier.rating ?? null,
      isPreferredSupplier: supplier.isPreferredSupplier,
      contractNumber: supplier.contractNumber ?? null,
      leadTime: supplier.leadTime ?? null,
    },
    metadata: supplier.metadata ?? {},
    deletedAt: supplier.deletedAt ?? null,
  };
}
```

---

### 4. Padrão alternativo: Classe estática (VolumeMapper, RequestMapper)

Alguns módulos mais recentes ou com necessidades bidirecionals agrupam as três direções em uma classe com métodos estáticos. O padrão é equivalente em resultado, mas concentra tudo em um único arquivo.

**Exemplo — `src/mappers/stock/volume.mapper.ts`:**

```typescript
export class VolumeMapper {
  // Domínio → Prisma (escrita)
  static toPersistence(volume: Volume): Prisma.VolumeUncheckedCreateInput { ... }

  // Prisma → Domínio (leitura)
  static toDomain(raw: PrismaVolume): Volume { ... }

  // Domínio → DTO (resposta HTTP)
  static toDTO(volume: Volume): VolumeDTO { ... }
}
```

**Exemplo — `src/mappers/requests/request-mapper.ts`:**

```typescript
export class RequestMapper {
  static toDomain(raw: PrismaRequest): Request { ... }
  static toPrisma(request: Request): Prisma.RequestUncheckedCreateInput { ... }
}
```

---

### 5. Mapper com tipo Prisma Payload tipado

Quando a query sempre inclui relações via `include`, o tipo do parâmetro usa `Prisma.{Entity}GetPayload<{include: ...}>` para garantir segurança de tipos:

**Exemplo — `src/mappers/hr/employee/employee-prisma-to-domain.ts`:**

```typescript
export function mapEmployeePrismaToDomain(
  employeeDb: Prisma.EmployeeGetPayload<{
    include: {
      user: true;
      department: true;
      position: true;
      supervisor: true;
    };
  }>,
) {
  return {
    tenantId: new UniqueEntityID(employeeDb.tenantId),
    cpf: CPF.create(employeeDb.cpf),       // validação no Value Object
    pis: employeeDb.pis ? PIS.create(employeeDb.pis) : undefined,
    status: EmployeeStatus.create(employeeDb.status),
    contractType: ContractType.create(employeeDb.contractType),
    workRegime: WorkRegime.create(employeeDb.workRegime),
    // Decimal → number
    baseSalary: Number(employeeDb.baseSalary),
    weeklyHours: Number(employeeDb.weeklyHours),
    // JSON opaco → tipo estruturado com cast
    emergencyContactInfo: employeeDb.emergencyContactInfo
      ? (employeeDb.emergencyContactInfo as unknown as EmergencyContactInfo)
      : undefined,
    healthConditions: employeeDb.healthConditions
      ? (employeeDb.healthConditions as unknown as HealthCondition[])
      : undefined,
    ...
  };
}
```

---

### 6. DTO com campos computados

O DTO pode expor campos calculados que não existem diretamente na entidade ou no banco. O cálculo ocorre na entidade de domínio e o mapper simplesmente os expõe:

**Exemplo — `src/mappers/finance/finance-entry/finance-entry-to-dto.ts`:**

```typescript
export interface FinanceEntryDTO {
  expectedAmount: number;
  actualAmount?: number;
  discount: number;
  interest: number;
  penalty: number;
  totalDue: number;           // campo computado da entidade
  remainingBalance: number;   // campo computado da entidade
  isOverdue: boolean;         // campo computado da entidade
  ...
}

export function financeEntryToDTO(entry: FinanceEntry): FinanceEntryDTO {
  return {
    ...
    totalDue: entry.totalDue,             // getter calculado na entidade
    remainingBalance: entry.remainingBalance,
    isOverdue: entry.isOverdue,
    ...
  };
}
```

---

### 7. DTOs com variante de detalhe

Quando um endpoint "detalhe" retorna mais informações do que o endpoint "lista", o arquivo de DTO define duas interfaces e duas funções:

**Exemplo — `src/mappers/hr/company/company-to-dto.ts`:**

```typescript
export interface CompanyDTO { ... }                             // listagem
export interface CompanyWithDetailsDTO extends CompanyDTO {    // detalhe
  departments?: DepartmentDTO[];
  departmentsCount: number;
}

export function companyToDTO(company: Company): CompanyDTO { ... }

export function companyToDetailsDTO(data: {
  company: Company;
  departments?: Department[];
}): CompanyWithDetailsDTO {
  return {
    ...companyToDTO(company),                  // spread da versão simples
    departments: departments?.map(departmentToDTO),
    departmentsCount: departments?.length ?? 0,
  };
}
```

---

## Value Object Handling

Os Value Objects do domínio são construídos no mapper Prisma → Domínio e "abertos" (extraído o `.value`) no mapper Domínio → DTO.

| Value Object | Criação no mapper | Extração no DTO |
|---|---|---|
| `UniqueEntityID` | `new UniqueEntityID(raw.id)` | `.toString()` |
| `Slug` | `Slug.create(raw.slug)` ou `Slug.createFromText(raw.name)` | `.value` |
| `ProductStatus` | `ProductStatus.create(raw.status)` | `.value` → `'ACTIVE'` \| ... |
| `ItemStatus` | `ItemStatus.create(raw.status)` | `.value` |
| `CustomerType` | `CustomerType.create(raw.type)` | `.value` |
| `Document` | `Document.create(raw.document)` | `.value` |
| `CPF` | `CPF.create(raw.cpf)` | `.value` (sem formatação) ou `.formatted` |
| `PIS` | `PIS.create(raw.pis)` | `.value` |
| `EmployeeStatus` | `EmployeeStatus.create(raw.status)` | `.value` |
| `ContractType` | `ContractType.create(raw.contractType)` | `.value` |
| `WorkRegime` | `WorkRegime.create(raw.workRegime)` | `.value` |
| `Url` | `Url.create(raw.avatarUrl)` | `.toString()` |
| `PermissionCode` | `PermissionCode.create(raw.code)` | (não exposto em DTO) |
| `OrderStatus` | `OrderStatus.create(raw.status)` | `.value` |
| `StorageFileStatus` | `StorageFileStatus.create(raw.status as ...)` | (não exposto) |
| `VolumeStatus` | cast direto: `raw.status as unknown as VolumeStatus` | (string do enum) |

**Padrão de fallback para Slug vazio** (presente em `product`, `variant`, `item`):

```typescript
const slug =
  raw.slug && raw.slug.trim()
    ? Slug.create(raw.slug)
    : Slug.createFromText(raw.name || 'product'); // fallback defensivo
```

**Conversão Decimal → number** (campos de preço/custo do Prisma):

```typescript
price: Number(variantDb.price.toString()),
baseSalary: Number(employeeDb.baseSalary),
totalCost: orderDb.totalCost.toNumber(),
```

---

## Nested Entity Mapping

Relações carregadas via `include` são mapeadas recursivamente chamando o mapper da entidade relacionada. O padrão é sempre verificar se a relação existe antes de mapear:

**Relação 1-N (Produto → Variantes):**

```typescript
variants: productDb.variants
  ? productDb.variants.map(variantPrismaToDomain)
  : undefined,
```

**Relação N-N via tabela pivot (Produto → Categorias):**

```typescript
productCategories: productDb.productCategories
  ? productDb.productCategories.map((pc) => ({
      category: categoryPrismaToDomain(pc.category),
    }))
  : undefined,
```

**Relação 1-N com instanciação inline (PurchaseOrder → Items):**

```typescript
const items = orderDb.items.map((itemDb) =>
  PurchaseOrderItem.create(
    {
      id: new UniqueEntityID(itemDb.id),
      orderId: new UniqueEntityID(itemDb.orderId),
      quantity: itemDb.quantity.toNumber(),
      unitCost: itemDb.unitCost.toNumber(),
      ...
    },
    new UniqueEntityID(itemDb.id),
  ),
);
```

**Relação com JSON polimórfico (Organization → typeSpecificData):**

```typescript
const typeSpecificData = (raw.typeSpecificData as TypeSpecificDataShape) ?? {};
const companyData: CompanySpecificData = {
  legalNature: typeSpecificData.legalNature ?? null,
  activityStartDate: typeSpecificData.activityStartDate
    ? new Date(typeSpecificData.activityStartDate)
    : null,
  pendingIssues: typeSpecificData.pendingIssues ?? [],
};
```

---

## Files

Exemplos por módulo para referência rápida:

| Módulo | Prisma → Domínio | Domínio → DTO | Domínio → Prisma |
|--------|-----------------|---------------|-----------------|
| Stock / Product | `src/mappers/stock/product/product-prisma-to-domain.ts` | `src/mappers/stock/product/product-to-dto.ts` | — |
| Stock / Variant | `src/mappers/stock/variant/variant-prisma-to-domain.ts` | — | — |
| Stock / Item | `src/mappers/stock/item/item-prisma-to-domain.ts` | — | — |
| Stock / PurchaseOrder | `src/mappers/stock/purchase-order/purchase-order-prisma-to-domain.ts` | — | — |
| Stock / Volume | `src/mappers/stock/volume.mapper.ts` (classe) | `src/mappers/stock/volume.mapper.ts` (classe) | `src/mappers/stock/volume.mapper.ts` (classe) |
| HR / Employee | `src/mappers/hr/employee/employee-prisma-to-domain.ts` | `src/mappers/hr/employee/employee-to-dto.ts` | — |
| HR / Company | `src/mappers/hr/company/company-prisma-to-domain.ts` | `src/mappers/hr/company/company-to-dto.ts` | — |
| HR / Organization | `src/mappers/hr/organization/company-organization-prisma-to-domain.ts` | `src/mappers/hr/organization/manufacturer-to-dto.ts` | `src/mappers/hr/organization/supplier-organization-domain-to-prisma.ts` |
| Core / UserProfile | `src/mappers/core/user/user-profile-prisma-to-domain.ts` | `src/mappers/core/user/user-profile-to-dto.ts` | — |
| Core / Tenant | — | `src/mappers/core/tenant/tenant-to-dto.ts` | — |
| Sales / Customer | `src/mappers/sales/customer/customer-prisma-to-domain.ts` | `src/mappers/sales/customer/customer-to-dto.ts` | — |
| Finance / FinanceEntry | `src/mappers/finance/finance-entry/finance-entry-prisma-to-domain.ts` | `src/mappers/finance/finance-entry/finance-entry-to-dto.ts` | — |
| Storage / StorageFile | `src/mappers/storage/storage-file/storage-file-prisma-to-domain.ts` | — | — |
| RBAC / Permission | `src/mappers/rbac/permission-prisma-to-domain.ts` | — | — |
| Requests / Request | `src/mappers/requests/request-mapper.ts` (classe) | — | `src/mappers/requests/request-mapper.ts` (classe) |

---

## Rules

### Quando usar

- Sempre que um repositório Prisma precisar converter um registro do banco para uma entidade de domínio.
- Sempre que um controller ou use case precisar converter uma entidade de domínio para JSON de resposta.
- Sempre que um repositório precisar construir o payload de escrita a partir de uma entidade de domínio com lógica não trivial (polimorfismo, JSON, etc.).

### Quando NÃO usar

- Não use mappers para converter entre dois DTOs (ex: request DTO → response DTO sem passar pelo domínio). Isso indica que a camada de domínio está sendo ignorada.
- Não coloque lógica de negócio nos mappers. Se uma conversão exigir uma decisão condicional além de tratamento de nulos, mova a lógica para a entidade.
- Não importe mappers diretamente em use cases. Use cases recebem entidades prontas dos repositórios; os repositórios é que chamam os mappers internamente.

### Armadilhas comuns

**1. Esquecer de converter `null` → `undefined`**

O Prisma retorna `null` para campos opcionais. O domínio usa `undefined`. A conversão `?? undefined` é obrigatória em todos os campos nullable:

```typescript
// Correto
description: productDb.description ?? undefined,

// Errado — passa null para o domínio
description: productDb.description,
```

**2. Esquecer de converter `Decimal` → `number`**

Campos monetários e quantidades no Prisma são do tipo `Decimal` (objeto, não primitivo). O domínio trabalha com `number`:

```typescript
// Correto
price: Number(variantDb.price.toString()),
totalCost: orderDb.totalCost.toNumber(),

// Errado — Decimal não é number
price: variantDb.price,
```

**3. Expor Value Objects no DTO**

O DTO deve conter apenas tipos primitivos serializáveis. Value Objects não são serializáveis por padrão:

```typescript
// Correto
status: product.status.value,   // 'ACTIVE'

// Errado — ProductStatus não serializa corretamente
status: product.status,
```

**4. Mapear relações sem verificar presença**

Relações carregadas via `include` são opcionais dependendo da query. Acessar sem verificar causa runtime error:

```typescript
// Correto
variants: productDb.variants
  ? productDb.variants.map(variantPrismaToDomain)
  : undefined,

// Errado — productDb.variants pode ser undefined
variants: productDb.variants.map(variantPrismaToDomain),
```

**5. Colocar a interface DTO em arquivo separado dos mappers**

A interface DTO deve estar no mesmo arquivo `{entity}-to-dto.ts` que a função de conversão. Isso facilita manutenção — alteração de campo exige atualização da interface e da função no mesmo lugar.

**6. Importar mappers nos use cases**

Os use cases não devem importar mappers. O fluxo correto é:

```
Controller → UseCase.execute(request) → Repository.findById(id) → mapper(raw) → Entity
Controller ← productToDTO(entity) ← UseCase retorna entity ← Entity
```

O mapper `toDTO` é chamado no controller, não no use case.
