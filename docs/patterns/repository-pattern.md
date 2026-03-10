# Pattern: Repository Pattern

## Problem

O código de acesso a dados (SQL, ORM, cache) não deve estar misturado com regras de negócio. Sem uma separação clara:

- Casos de uso ficam acoplados ao Prisma — impossível testar sem banco de dados real.
- Trocar o banco de dados ou ORM exige alterar use cases, violando o Princípio da Inversão de Dependência.
- Testes unitários ficam lentos, frágeis e difíceis de isolar.

## Solution

O **Repository Pattern** introduz uma **interface** (contrato) que descreve _o que_ pode ser feito com os dados, sem revelar _como_ isso é feito. Dois artefatos implementam essa interface:

| Implementação | Onde é usada | Como funciona |
|---|---|---|
| `PrismaXyzRepository` | Produção | Acessa PostgreSQL via Prisma ORM |
| `InMemoryXyzRepository` | Testes unitários | Armazena dados em um array em memória |

O use case conhece apenas a interface — nunca a implementação concreta. As fábricas (`make-*.ts`) conectam as peças em produção.

```
Interface (contrato)
  ↑ implementada por
  ├── PrismaXyzRepository      (produção)
  └── InMemoryXyzRepository    (testes unitários)
        ↑ injetado via
        Use Case
          ↑ construído por
          make-xyz-use-case.ts (fábrica)
            ↑ chamado por
            Controller (HTTP layer)
```

## Implementation

### 1. Interface do Repositório

A interface fica em `src/repositories/{module}/{resource}-repository.ts` e define:

- **`CreateXyzSchema`**: tipos dos dados de entrada para criação (mais restritivo que o schema HTTP — usa `UniqueEntityID`, `ValueObject`, etc.).
- **`UpdateXyzSchema`**: tipos dos dados de entrada para atualização (campos opcionais, inclui `id`).
- **`XyzRepository`**: os métodos que todo repositório deve implementar.

Exemplo real — `src/repositories/stock/products-repository.ts`:

```typescript
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { Slug } from '@/entities/stock/value-objects/slug';

export interface CreateProductSchema {
  tenantId: string;
  name: string;
  slug: Slug;          // Value Object — não é string crua
  fullCode: string;    // Código hierárquico: TEMPLATE.FABRICANTE.PRODUTO
  barcode: string;
  eanCode: string;
  upcCode: string;
  description?: string;
  status?: ProductStatus;
  outOfLine?: boolean;
  templateId: UniqueEntityID;   // Referência tipada, não string
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  attributes?: Record<string, unknown>;
  categoryIds?: string[];
}

export interface UpdateProductSchema {
  id: UniqueEntityID;
  name?: string;
  // fullCode e barcode são imutáveis após criação — ausentes no UpdateSchema
  description?: string;
  status?: ProductStatus;
  outOfLine?: boolean;
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  attributes?: Record<string, unknown>;
  categoryIds?: string[];
}

export interface ProductsRepository {
  create(data: CreateProductSchema): Promise<Product>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Product | null>;
  findByName(name: string, tenantId: string): Promise<Product | null>;
  findMany(tenantId: string): Promise<Product[]>;
  findManyByStatus(status: ProductStatus, tenantId: string): Promise<Product[]>;
  findManyByTemplate(templateId: UniqueEntityID, tenantId: string): Promise<Product[]>;
  findManyByManufacturer(manufacturerId: UniqueEntityID, tenantId: string): Promise<Product[]>;
  findManyByCategory(categoryId: UniqueEntityID, tenantId: string): Promise<Product[]>;
  update(data: UpdateProductSchema): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  getNextSequentialCode(): Promise<number>;
}
```

**Observações importantes:**

- Os schemas de entrada usam Value Objects e `UniqueEntityID` — nunca strings cruas para campos tipados.
- Campos imutáveis após criação (como `fullCode`, `barcode`) são **omitidos** do `UpdateSchema` — isso impede alterações acidentais.
- Métodos de leitura sempre recebem `tenantId: string` para garantir isolamento multi-tenant.
- O retorno é sempre a entidade de domínio (`Product`), nunca um tipo Prisma.

---

### 2. Implementação Prisma (Produção)

Localização: `src/repositories/{module}/prisma/prisma-{resource}-repository.ts`

A classe implementa a interface e usa o Prisma Client para acessar o banco. O mapeamento de dados do banco para domínio é feito por uma função de mapper dedicada.

Exemplo real — trecho de `src/repositories/stock/prisma/prisma-products-repository.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import { productPrismaToDomain } from '@/mappers/stock/product/product-prisma-to-domain';
import type { CreateProductSchema, ProductsRepository, UpdateProductSchema } from '../products-repository';

// Constante com os includes reutilizados em vários métodos
const productInclude = {
  template: true,
  supplier: true,
  manufacturer: true,
  variants: { where: { deletedAt: null } },
  productCategories: {
    include: { category: true },
    where: { category: { deletedAt: null } },
  },
  productTags: {
    include: { tag: true },
    where: { tag: { deletedAt: null } },
  },
} as const;

export class PrismaProductsRepository implements ProductsRepository {
  async create(data: CreateProductSchema): Promise<Product> {
    // Quando há categorias: usa prisma.$transaction para criar produto + vínculos atomicamente
    if (data.categoryIds && data.categoryIds.length > 0) {
      const productData = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({ data: { ...productCreateData } });
        await tx.productCategory.createMany({
          data: data.categoryIds!.map((categoryId, index) => ({
            productId: created.id,
            categoryId,
            order: index,
          })),
        });
        return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: productInclude });
      });
      return productPrismaToDomain(productData);
    }

    // Caso simples: cria diretamente sem transação
    const productData = await prisma.product.create({ data: productCreateData });
    return productPrismaToDomain(productData);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Product | null> {
    const productData = await prisma.product.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,   // soft delete — registros deletados são ignorados
      },
      include: { template: true, supplier: true, manufacturer: true, ... },
    });
    if (!productData) return null;
    return productPrismaToDomain(productData);
  }

  async findMany(tenantId: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: productInclude,
    });
    return products.map(productPrismaToDomain);
  }

  async update(data: UpdateProductSchema): Promise<Product | null> {
    // Quando categoryIds é fornecido: transação para recriar vínculos
    if (data.categoryIds !== undefined) {
      const productData = await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id: data.id.toString() }, data: { ... } });
        await tx.productCategory.deleteMany({ where: { productId: data.id.toString() } });
        if (data.categoryIds!.length > 0) {
          await tx.productCategory.createMany({ data: data.categoryIds!.map(...) });
        }
        return tx.product.findUniqueOrThrow({ where: { id: data.id.toString() }, include: productInclude });
      });
      return productPrismaToDomain(productData);
    }

    const productData = await prisma.product.update({
      where: { id: data.id.toString() },
      data: { name: data.name, description: data.description, ... },
      include: productInclude,
    });
    return productPrismaToDomain(productData);
  }

  async save(product: Product): Promise<void> {
    // "save" recebe a entidade já modificada e persiste o estado atual
    await prisma.product.update({
      where: { id: product.id.toString() },
      data: {
        name: product.name,
        status: product.status.value as PrismaProductStatus,
        updatedAt: new Date(),
        ...
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    // Soft delete: seta deletedAt ao invés de remover o registro
    await prisma.product.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
```

**Convenções da implementação Prisma:**

| Situação | Abordagem |
|---|---|
| Leitura de entidade com relacionamentos | Usa `include` constante reutilizável |
| Conversão Prisma → Entidade de domínio | Delegada ao mapper (`productPrismaToDomain`) |
| IDs passados para o Prisma | `.toString()` em `UniqueEntityID` |
| Enums de domínio passados ao Prisma | Cast explícito (`status.value as PrismaProductStatus`) |
| Remoção de registros | **Sempre soft delete** via `deletedAt: new Date()` |
| Queries de leitura | Filtram `deletedAt: null` |
| Operações com múltiplas tabelas | `prisma.$transaction(async (tx) => ...)` |

---

### 3. Implementação In-Memory (Testes)

Localização: `src/repositories/{module}/in-memory/in-memory-{resource}-repository.ts`

A implementação in-memory mantém os dados em um array público (`public items: Produto[]`) — isso permite que os testes leiam o estado interno do repositório para verificar resultados.

Exemplo real — trecho de `src/repositories/stock/in-memory/in-memory-products-repository.ts`:

```typescript
import type { CreateProductSchema, ProductsRepository, UpdateProductSchema } from '../products-repository';

export class InMemoryProductsRepository implements ProductsRepository {
  public items: Product[] = [];         // público para inspeção nos testes
  private sequentialCounter = 0;        // substitui a sequence do banco

  async create(data: CreateProductSchema): Promise<Product> {
    const product = Product.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      slug: data.slug,
      ...
    });
    this.items.push(product);
    return product;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Product | null> {
    const product = this.items.find(
      (item) =>
        !item.deletedAt &&                           // respeita soft delete
        item.id.equals(id) &&                        // comparação por valor (não referência)
        item.tenantId.toString() === tenantId,       // isolamento multi-tenant
    );
    return product ?? null;
  }

  async findMany(tenantId: string): Promise<Product[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateProductSchema): Promise<Product | null> {
    const product = this.items.find((item) => !item.deletedAt && item.id.equals(data.id)) ?? null;
    if (!product) return null;

    // Atualiza apenas os campos fornecidos (undefined = não alterar)
    if (data.name !== undefined) product.name = data.name;
    if (data.status !== undefined) product.status = data.status;
    ...
    return product;
  }

  async save(product: Product): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(product.id));
    if (index >= 0) {
      this.items[index] = product;  // substitui a referência inteira
    } else {
      this.items.push(product);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const product = this.items.find((item) => !item.deletedAt && item.id.equals(id)) ?? null;
    if (product) {
      product.delete();  // chama o método de domínio que seta deletedAt
    }
  }

  async getNextSequentialCode(): Promise<number> {
    this.sequentialCounter += 1;  // simula a sequence do PostgreSQL
    return this.sequentialCounter;
  }
}
```

**Convenções da implementação In-Memory:**

| Situação | Abordagem |
|---|---|
| Comparação de IDs | `.id.equals(id)` — nunca `===` (são objetos) |
| Soft delete nas queries | `!item.deletedAt` |
| Isolamento multi-tenant | `item.tenantId.toString() === tenantId` |
| Atualização parcial | `if (data.campo !== undefined) entity.campo = data.campo` |
| Sequences do banco | Contador privado incrementado manualmente |
| Parâmetros de transação | `_tx?: unknown` — ignorados na implementação in-memory |

---

### 4. Suporte a TransactionClient

Para operações que precisam de atomicidade entre múltiplos repositórios, o projeto usa o `TransactionManager` — definido em `src/lib/transaction-manager.ts`.

```typescript
// src/lib/transaction-manager.ts

// Tipo que representa o cliente dentro de uma transação Prisma
export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Interface que abstrai o gerenciador de transações do domínio
export interface TransactionManager {
  run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
}

// Implementação real: usa prisma.$transaction com timeout de 30 segundos
export class PrismaTransactionManager implements TransactionManager {
  async run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(
      (tx) => fn(tx as unknown as TransactionClient),
      { timeout: 30_000 },
    );
  }
}
```

**Como os repositórios recebem o `tx`:**

Os métodos que participam de transações aceitam o `TransactionClient` como parâmetro opcional. Quando `tx` é fornecido, o repositório usa `tx` em vez do cliente global `prisma`.

Exemplo real — `src/repositories/finance/finance-entries-repository.ts`:

```typescript
export interface FinanceEntriesRepository {
  // tx?: TransactionClient — opcional para compatibilidade com in-memory
  create(data: CreateFinanceEntrySchema, tx?: TransactionClient): Promise<FinanceEntry>;
  generateNextCode(tenantId: string, type: string, tx?: TransactionClient): Promise<string>;
  // ...outros métodos sem tx (não precisam de transação)
}
```

Implementação Prisma — `src/repositories/finance/prisma/prisma-finance-entries-repository.ts`:

```typescript
async create(data: CreateFinanceEntrySchema, tx?: TransactionClient): Promise<FinanceEntry> {
  const client = tx ?? prisma;  // usa tx se fornecido, senão usa o cliente global

  const entry = await client.financeEntry.create({ data: { ... } });
  return financeEntryPrismaToDomain(entry);
}
```

Implementação In-Memory — aceita e ignora o parâmetro:

```typescript
async create(data: CreateFinanceEntrySchema, _tx?: unknown): Promise<FinanceEntry> {
  // _tx é ignorado — in-memory não tem transações reais
  const entry = FinanceEntry.create({ ... });
  this.items.push(entry);
  return entry;
}
```

---

### 5. Injeção de Dependência nos Use Cases

O use case recebe os repositórios no **construtor** como interfaces — nunca instancia os repositórios diretamente.

Exemplo real — `src/use-cases/stock/products/create-product.ts`:

```typescript
export class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,       // interface
    private templatesRepository: TemplatesRepository,     // interface
    private suppliersRepository: SuppliersRepository,     // interface
    private manufacturersRepository: ManufacturersRepository, // interface
    private categoriesRepository: CategoriesRepository,   // interface
  ) {}

  async execute(request: CreateProductUseCaseRequest): Promise<CreateProductUseCaseResponse> {
    // Usa apenas a interface — não sabe se é Prisma ou InMemory
    const existingProduct = await this.productsRepository.findByName(name, tenantId);
    if (existingProduct) throw new BadRequestError('Produto com este nome já existe');

    const template = await this.templatesRepository.findById(
      new UniqueEntityID(templateId),
      tenantId,
    );
    if (!template) throw new ResourceNotFoundError('Template não encontrado');

    const createdProduct = await this.productsRepository.create({ ... });
    return { product: createdProduct };
  }
}
```

Para use cases com `TransactionManager`:

```typescript
export class CreateFinanceEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private categoriesRepository: FinanceCategoriesRepository,
    private costCentersRepository: CostCentersRepository,
    private calendarSyncService?: CalendarSyncService,
    private transactionManager?: TransactionManager,   // opcional — permite teste sem tx
    private costCenterAllocationsRepository?: FinanceEntryCostCentersRepository,
  ) {}

  async execute(request: CreateFinanceEntryUseCaseRequest) {
    // ...validações...

    const needsTransaction =
      (request.costCenterAllocations?.length ?? 0) > 0 ||
      request.recurrenceType === 'INSTALLMENT' ||
      request.recurrenceType === 'RECURRING';

    if (this.transactionManager && needsTransaction) {
      return this.transactionManager.run(async (tx) => {
        return this.createWithChildren(request, tx);
      });
    }

    return this.createWithChildren(request);
  }

  private async createWithChildren(request, tx?: TransactionClient) {
    const code = await this.financeEntriesRepository.generateNextCode(
      request.tenantId, request.type, tx,
    );
    const entry = await this.financeEntriesRepository.create({ ... }, tx);
    // ...criação de parcelas, rateios, etc. — todos passam tx
    return { entry: financeEntryToDTO(entry) };
  }
}
```

---

### 6. Fábricas (make-*.ts)

As fábricas instanciam as implementações concretas e montam o grafo de dependências. São o único lugar do sistema onde `new PrismaXyzRepository()` aparece.

Localização: `src/use-cases/{module}/{resource}/factories/make-{action}-{resource}-use-case.ts`

Exemplo simples — `src/use-cases/stock/products/factories/make-create-product-use-case.ts`:

```typescript
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { CreateProductUseCase } from '@/use-cases/stock/products/create-product';

export function makeCreateProductUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const suppliersRepository = new PrismaSuppliersRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();
  const categoriesRepository = new PrismaCategoriesRepository();

  return new CreateProductUseCase(
    productsRepository,
    templatesRepository,
    suppliersRepository,
    manufacturersRepository,
    categoriesRepository,
  );
}
```

Exemplo com `TransactionManager` — `src/use-cases/finance/entries/factories/make-create-finance-entry-use-case.ts`:

```typescript
import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaFinanceEntryCostCentersRepository } from '@/repositories/finance/prisma/prisma-finance-entry-cost-centers-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { CreateFinanceEntryUseCase } from '../create-finance-entry';

export function makeCreateFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const costCentersRepository = new PrismaCostCentersRepository();
  const calendarSyncService = makeCalendarSyncService();
  const transactionManager = new PrismaTransactionManager();
  const costCenterAllocationsRepository = new PrismaFinanceEntryCostCentersRepository();

  return new CreateFinanceEntryUseCase(
    entriesRepository,
    categoriesRepository,
    costCentersRepository,
    calendarSyncService,
    transactionManager,
    costCenterAllocationsRepository,
  );
}
```

Os controllers chamam a fábrica:

```typescript
// src/http/controllers/stock/products/v1-create-product.controller.ts
export async function v1CreateProductController(app: FastifyInstance) {
  app.post('/v1/products', {
    preHandler: [verifyJwt, verifyTenant, verifyPermission('stock.products.create')],
  }, async (request, reply) => {
    const useCase = makeCreateProductUseCase(); // instanciação aqui
    const { product } = await useCase.execute({ ... });
    return reply.status(201).send({ product: productToDTO(product) });
  });
}
```

---

### 7. Mappers (Prisma → Domínio)

Os mappers convertem o tipo Prisma (retornado pelo ORM) para a entidade de domínio. Ficam em `src/mappers/{module}/{resource}/{resource}-prisma-to-domain.ts`.

Exemplo real — trecho de `src/mappers/stock/product/product-prisma-to-domain.ts`:

```typescript
type ProductWithRelations = PrismaProduct & {
  template?: PrismaTemplate;
  supplier?: PrismaSupplier | null;
  variants?: PrismaVariant[];
  productCategories?: Array<{ category: PrismaCategory }>;
};

export function productPrismaToDomain(productDb: ProductWithRelations): Product {
  const slug = productDb.slug?.trim()
    ? Slug.create(productDb.slug)
    : Slug.createFromText(productDb.name || 'product');

  return Product.create(
    {
      id: new UniqueEntityID(productDb.id),
      tenantId: new UniqueEntityID(productDb.tenantId),
      name: productDb.name,
      slug,
      status: ProductStatus.create(productDb.status),  // enum Prisma → Value Object
      templateId: new UniqueEntityID(productDb.templateId),
      template: productDb.template ? templatePrismaToDomain(productDb.template) : undefined,
      variants: productDb.variants?.map(variantPrismaToDomain),
      createdAt: productDb.createdAt,
      deletedAt: productDb.deletedAt ?? undefined,
      ...
    },
    new UniqueEntityID(productDb.id),
  );
}
```

---

## Files

### Interfaces (contratos)

```
src/repositories/
  stock/
    products-repository.ts       # CreateProductSchema, UpdateProductSchema, ProductsRepository
    variants-repository.ts
    items-repository.ts          # + ItemWithRelationsDTO para queries com joins
    warehouses-repository.ts
    ...
  core/
    users-repository.ts          # + UpdateUserSchema com todos os campos de segurança
    plans-repository.ts
    tenants-repository.ts
    ...
  finance/
    finance-entries-repository.ts  # + FindManyFinanceEntriesOptions, FindManyResult, tx suporte
    loans-repository.ts
    ...
  hr/
    employees-repository.ts       # + EmployeeWithRawRelations para joins
    departments-repository.ts
    ...
  rbac/
    permissions-repository.ts
    permission-groups-repository.ts
    ...
  storage/
    storage-files-repository.ts
    storage-folders-repository.ts
    ...
```

### Implementações Prisma

```
src/repositories/{module}/prisma/
  prisma-{resource}-repository.ts
```

### Implementações In-Memory

```
src/repositories/{module}/in-memory/
  in-memory-{resource}-repository.ts
```

### Fábricas

```
src/use-cases/{module}/{resource}/factories/
  make-{action}-{resource}-use-case.ts
```

### TransactionManager

```
src/lib/transaction-manager.ts   # TransactionClient, TransactionManager, PrismaTransactionManager
```

---

## Métodos Comuns

A maioria dos repositórios implementa os seguintes métodos com semântica consistente:

| Método | Assinatura típica | Comportamento |
|---|---|---|
| `create` | `(data: CreateXyzSchema, tx?) => Promise<Xyz>` | Persiste e retorna a entidade criada |
| `findById` | `(id: UniqueEntityID, tenantId: string) => Promise<Xyz \| null>` | Busca por ID, filtra `deletedAt: null` |
| `findMany` | `(tenantId: string) => Promise<Xyz[]>` | Lista todos os registros ativos do tenant |
| `findManyBy{Campo}` | `(campo: Tipo, tenantId: string) => Promise<Xyz[]>` | Lista filtrado por um campo específico |
| `update` | `(data: UpdateXyzSchema) => Promise<Xyz \| null>` | Atualiza campos selecionados, retorna `null` se não encontrado |
| `save` | `(entity: Xyz) => Promise<void>` | Persiste o estado atual de uma entidade já modificada |
| `delete` | `(id: UniqueEntityID) => Promise<void>` | Soft delete via `deletedAt = new Date()` |

**Diferença entre `update` e `save`:**

- `update(data: UpdateXyzSchema)` — recebe um DTO com apenas os campos a alterar. Usado quando o use case determina quais campos mudar sem carregar a entidade primeiro.
- `save(entity: Xyz)` — recebe a entidade de domínio completa já modificada. Usado quando o use case carrega a entidade, aplica mudanças nos setters da entidade, e então persiste o novo estado.

**Paginação** — repositórios que suportam listagem paginada definem uma interface de opções e retornam `{ items, total }`:

```typescript
// Exemplo de FindManyFinanceEntriesOptions (finance-entries-repository.ts)
export interface FindManyFinanceEntriesOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  // ...outros filtros
}

export interface FindManyResult {
  entries: FinanceEntry[];
  total: number;
}
```

---

## Rules

### Quando usar o padrão

- Sempre que um use case precisar acessar dados persistidos.
- Para qualquer nova entidade de domínio, crie os três artefatos: interface + Prisma + InMemory.

### Quando NÃO usar

- Não crie repositórios para dados que não são entidades de domínio (ex: tabelas de pivot intermediárias acessadas apenas internamente por outro repositório).
- Não use o Prisma Client diretamente em use cases — isso quebra a testabilidade.
- Não injete repositórios em outros repositórios — repositórios não se chamam entre si.

### Armadilhas comuns

**1. Esquecer o filtro `deletedAt: null` na implementação Prisma:**

```typescript
// ERRADO — retorna registros deletados
const product = await prisma.product.findUnique({ where: { id } });

// CORRETO
const product = await prisma.product.findUnique({ where: { id, deletedAt: null } });
```

**2. Comparar `UniqueEntityID` com `===`:**

```typescript
// ERRADO — compara referências de objeto (sempre false entre instâncias diferentes)
if (item.id === id) { ... }

// CORRETO — compara os valores internos
if (item.id.equals(id)) { ... }
```

**3. Esquecer o isolamento de tenant na implementação In-Memory:**

```typescript
// ERRADO — retorna dados de outros tenants
const product = this.items.find((i) => i.id.equals(id));

// CORRETO
const product = this.items.find(
  (i) => i.id.equals(id) && i.tenantId.toString() === tenantId,
);
```

**4. Instanciar repositórios dentro de use cases:**

```typescript
// ERRADO — acopla o use case ao Prisma, impossibilita testes unitários
export class CreateProductUseCase {
  private repo = new PrismaProductsRepository();
}

// CORRETO — recebe via construtor
export class CreateProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}
}
```

**5. Passar `tx` mas esquecer de usar no banco:**

```typescript
// ERRADO — usa prisma global mesmo dentro de uma transação
async create(data, tx?: TransactionClient) {
  return prisma.financeEntry.create({ ... }); // ignora tx!
}

// CORRETO
async create(data, tx?: TransactionClient) {
  const client = tx ?? prisma;
  return client.financeEntry.create({ ... });
}
```

**6. Expor tipos Prisma fora do repositório:**

```typescript
// ERRADO — o use case vê o tipo Prisma
async findById(id: string): Promise<PrismaProduct> { ... }

// CORRETO — sempre retornar a entidade de domínio
async findById(id: UniqueEntityID, tenantId: string): Promise<Product | null> { ... }
```
