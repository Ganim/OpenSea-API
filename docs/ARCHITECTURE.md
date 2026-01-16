# Arquitetura - OpenSea-API

## Visão Geral

O OpenSea-API é construído seguindo os princípios da **Clean Architecture** combinados com **Domain-Driven Design (DDD)**. Esta arquitetura garante separação de responsabilidades, testabilidade e facilidade de manutenção.

## Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL WORLD                                  │
│                     (HTTP Clients, Mobile Apps, etc.)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HTTP LAYER (Interface)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Controllers   │  │   Middlewares   │  │   Schemas (Zod Validation)  │  │
│  │                 │  │   - Auth        │  │   - Request validation      │  │
│  │   - Routes      │  │   - RBAC        │  │   - Response serialization  │  │
│  │   - Handlers    │  │   - Rate Limit  │  │   - OpenAPI docs            │  │
│  └────────┬────────┘  └─────────────────┘  └─────────────────────────────┘  │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER (Use Cases)                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           Use Cases                                      │ │
│  │   - CreateProductUseCase                                                 │ │
│  │   - AuthenticateWithPasswordUseCase                                      │ │
│  │   - ListEmployeesUseCase                                                 │ │
│  │   - ...                                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           Services                                       │ │
│  │   - PermissionService (RBAC)                                             │ │
│  │   - CacheService                                                         │ │
│  │   - EmailService                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOMAIN LAYER (Entities)                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │      Entities       │  │    Value Objects    │  │    Domain Errors    │  │
│  │   - User            │  │   - Email           │  │   - BadRequestError │  │
│  │   - Product         │  │   - CPF/CNPJ        │  │   - NotFoundError   │  │
│  │   - Employee        │  │   - PermissionCode  │  │   - UnauthorizedErr │  │
│  │   - SalesOrder      │  │   - ItemStatus      │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER (Adapters)                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Repositories      │  │    External Libs    │  │      Workers        │  │
│  │   - Prisma impl.    │  │   - Redis           │  │   - EmailWorker     │  │
│  │   - In-Memory impl. │  │   - Sentry          │  │   - NotificationW.  │  │
│  │                     │  │   - BullMQ          │  │   - AuditWorker     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE LAYER                                  │
│                          PostgreSQL + Redis                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
src/
├── @env/                       # Variáveis de ambiente com validação Zod
│   └── index.ts
│
├── @errors/                    # Erros customizados da aplicação
│   ├── use-cases/              # Erros de casos de uso
│   │   ├── bad-request-error.ts
│   │   ├── unauthorized-error.ts
│   │   ├── forbidden-error.ts
│   │   └── resource-not-found.ts
│   └── error-handler.ts        # Handler global de erros
│
├── config/                     # Configurações da aplicação
│   ├── jwt.ts                  # Configuração JWT (RS256/HS256)
│   ├── redis.ts                # Configuração Redis
│   ├── rate-limits.ts          # Configuração de rate limiting
│   ├── circuit-breaker.ts      # Configuração circuit breaker
│   └── swagger-tags.ts         # Tags do Swagger/OpenAPI
│
├── constants/                  # Constantes e enums
│   ├── rbac/
│   │   ├── permission-codes.ts # Códigos de permissões
│   │   └── permission-groups.ts# Grupos pré-definidos
│   └── audit-messages/         # Mensagens de auditoria
│
├── entities/                   # DOMAIN LAYER - Entidades e Value Objects
│   ├── domain/                 # Classes base
│   │   ├── entity.ts           # Classe base Entity
│   │   ├── unique-entity-id.ts # Value Object para IDs
│   │   └── value-objects/      # Value Objects base
│   │
│   ├── core/                   # Entidades do módulo Core
│   │   ├── user.ts
│   │   ├── session.ts
│   │   └── refresh-token.ts
│   │
│   ├── stock/                  # Entidades do módulo Stock
│   │   ├── product.ts
│   │   ├── variant.ts
│   │   ├── item.ts
│   │   ├── warehouse.ts
│   │   └── ...
│   │
│   ├── sales/                  # Entidades do módulo Sales
│   │   ├── customer.ts
│   │   ├── sales-order.ts
│   │   └── ...
│   │
│   ├── hr/                     # Entidades do módulo HR
│   │   ├── employee.ts
│   │   ├── company.ts
│   │   ├── department.ts
│   │   └── ...
│   │
│   ├── rbac/                   # Entidades do RBAC
│   │   ├── permission.ts
│   │   ├── permission-group.ts
│   │   └── ...
│   │
│   └── audit/                  # Entidades de Auditoria
│       └── audit-log.ts
│
├── use-cases/                  # APPLICATION LAYER - Casos de uso
│   ├── core/
│   │   ├── auth/
│   │   │   ├── authenticate-with-password.ts
│   │   │   ├── authenticate-with-password.spec.ts
│   │   │   └── factories/
│   │   ├── sessions/
│   │   └── users/
│   │
│   ├── stock/
│   │   ├── products/
│   │   ├── variants/
│   │   ├── items/
│   │   └── ...
│   │
│   ├── sales/
│   ├── hr/
│   ├── rbac/
│   └── audit/
│
├── repositories/               # INFRASTRUCTURE - Repositórios
│   ├── core/
│   │   ├── prisma/             # Implementação Prisma
│   │   │   ├── prisma-users-repository.ts
│   │   │   └── ...
│   │   ├── in-memory/          # Implementação In-Memory (testes)
│   │   │   ├── in-memory-users-repository.ts
│   │   │   └── ...
│   │   └── users-repository.ts # Interface do repositório
│   │
│   ├── stock/
│   ├── sales/
│   ├── hr/
│   └── rbac/
│
├── http/                       # HTTP LAYER - Interface HTTP
│   ├── controllers/            # Controllers organizados por módulo
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── v1-authenticate-with-password.controller.ts
│   │   │   │   ├── v1-authenticate-with-password.e2e.spec.ts
│   │   │   │   └── routes.ts
│   │   │   ├── users/
│   │   │   ├── sessions/
│   │   │   └── me/
│   │   │
│   │   ├── stock/
│   │   ├── sales/
│   │   ├── hr/
│   │   ├── rbac/
│   │   ├── audit/
│   │   └── health/
│   │
│   ├── middlewares/
│   │   ├── auth/
│   │   │   └── verify-jwt.ts
│   │   └── rbac/
│   │       ├── verify-permission.ts
│   │       └── verify-scope.ts
│   │
│   ├── plugins/
│   │   └── request-id.plugin.ts
│   │
│   ├── schemas/                # Schemas Zod para validação
│   │   ├── common.schema.ts
│   │   ├── pagination.schema.ts
│   │   └── ...
│   │
│   └── routes.ts               # Registro central de rotas
│
├── mappers/                    # Mapeadores Domain <-> DTO <-> Prisma
│   ├── core/
│   ├── stock/
│   ├── sales/
│   └── hr/
│
├── services/                   # Serviços de aplicação
│   ├── cache/
│   │   └── cache-service.ts
│   ├── rbac/
│   │   └── permission-service.ts
│   └── email/
│       └── email-service.ts
│
├── lib/                        # Bibliotecas e integrações
│   ├── prisma.ts               # Cliente Prisma
│   ├── redis.ts                # Cliente Redis
│   ├── queue.ts                # BullMQ
│   ├── sentry.ts               # Sentry
│   ├── circuit-breaker.ts      # Circuit Breaker (opossum)
│   └── logger.ts               # Logger (Pino)
│
├── workers/                    # Workers de background (BullMQ)
│   ├── queues/
│   │   ├── email.queue.ts
│   │   ├── notification.queue.ts
│   │   └── audit.queue.ts
│   └── index.ts
│
├── utils/                      # Utilitários
│   └── tests/
│       └── factories/          # Factories para testes
│
├── app.ts                      # Configuração do Fastify
└── server.ts                   # Entry point
```

## Padrões de Design

### 1. Repository Pattern

Abstrai o acesso a dados, permitindo trocar a implementação sem afetar o domínio.

```typescript
// Interface (contrato)
interface UsersRepository {
  findById(id: UniqueEntityID): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  create(user: User): Promise<void>
}

// Implementação Prisma
class PrismaUsersRepository implements UsersRepository {
  async findById(id: UniqueEntityID): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: id.toString() }
    })
    return user ? UserMapper.toDomain(user) : null
  }
}

// Implementação In-Memory (testes)
class InMemoryUsersRepository implements UsersRepository {
  private users: User[] = []

  async findById(id: UniqueEntityID): Promise<User | null> {
    return this.users.find(u => u.id.equals(id)) ?? null
  }
}
```

### 2. Use Case Pattern

Encapsula regras de negócio em classes focadas com uma única responsabilidade.

```typescript
interface CreateProductUseCaseRequest {
  name: string
  sku: string
  categoryId: string
}

interface CreateProductUseCaseResponse {
  product: Product
}

class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private categoriesRepository: CategoriesRepository,
  ) {}

  async execute(
    request: CreateProductUseCaseRequest,
  ): Promise<CreateProductUseCaseResponse> {
    // 1. Validar categoria
    const category = await this.categoriesRepository.findById(request.categoryId)
    if (!category) {
      throw new ResourceNotFoundError('Category')
    }

    // 2. Verificar SKU único
    const existingSku = await this.productsRepository.findBySku(request.sku)
    if (existingSku) {
      throw new BadRequestError('SKU already exists')
    }

    // 3. Criar produto
    const product = Product.create({
      name: request.name,
      sku: request.sku,
      categoryId: category.id,
    })

    await this.productsRepository.create(product)

    return { product }
  }
}
```

### 3. Value Objects

Encapsulam valores com regras de validação e comportamento.

```typescript
class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Invalid email format')
    }
    return new Email(email.toLowerCase())
  }

  toString(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}
```

### 4. Factory Pattern

Centraliza a criação de use cases com suas dependências.

```typescript
// src/use-cases/stock/products/factories/make-create-product-use-case.ts
export function makeCreateProductUseCase() {
  const productsRepository = new PrismaProductsRepository()
  const categoriesRepository = new PrismaCategoriesRepository()

  return new CreateProductUseCase(
    productsRepository,
    categoriesRepository,
  )
}

// Uso no controller
const useCase = makeCreateProductUseCase()
const result = await useCase.execute(request)
```

### 5. Mapper Pattern

Converte entre camadas (Domain, Prisma, DTO).

```typescript
class ProductMapper {
  // Prisma -> Domain
  static toDomain(raw: PrismaProduct): Product {
    return Product.create({
      name: raw.name,
      sku: raw.sku,
      categoryId: new UniqueEntityID(raw.categoryId),
    }, new UniqueEntityID(raw.id))
  }

  // Domain -> Prisma
  static toPrisma(product: Product): Prisma.ProductCreateInput {
    return {
      id: product.id.toString(),
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId.toString(),
    }
  }

  // Domain -> DTO (API response)
  static toDTO(product: Product): ProductDTO {
    return {
      id: product.id.toString(),
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId.toString(),
      createdAt: product.createdAt.toISOString(),
    }
  }
}
```

## Fluxo de uma Request

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. MIDDLEWARE CHAIN                                                 │
│     - Request ID Plugin (adiciona X-Request-Id)                     │
│     - Helmet (headers de segurança)                                 │
│     - CORS                                                          │
│     - Rate Limit                                                    │
│     - Authentication (verifyJwt)                                    │
│     - Authorization (verifyPermission)                              │
└─────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. CONTROLLER                                                       │
│     - Extrai dados da request (params, query, body)                 │
│     - Valida com Zod schema                                         │
│     - Chama use case via factory                                    │
│     - Mapeia resultado para DTO                                     │
│     - Retorna response com status code apropriado                   │
└─────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. USE CASE                                                         │
│     - Valida regras de negócio                                      │
│     - Interage com repositórios                                     │
│     - Cria/modifica entidades de domínio                            │
│     - Dispara eventos (audit logs, notificações)                    │
│     - Retorna resultado ou lança erro                               │
└─────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. REPOSITORY                                                       │
│     - Converte entidade para formato do banco                       │
│     - Executa query no Prisma                                       │
│     - Converte resultado para entidade de domínio                   │
│     - Retorna entidade ou null                                      │
└─────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. DATABASE                                                         │
│     - PostgreSQL (dados)                                            │
│     - Redis (cache, sessões, filas)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Sistema de Permissões (RBAC)

### Estrutura de Permissões

```
{módulo}.{recurso}.{ação}[.{escopo}]

Exemplos:
- stock.products.create        # Criar produtos
- stock.products.read.all      # Ler todos os produtos
- stock.products.read.team     # Ler produtos do departamento
- hr.employees.update          # Atualizar funcionários
- rbac.permissions.manage      # Gerenciar permissões
```

### Hierarquia de Grupos

```
┌─────────────────────────────────────────┐
│           Administrador                  │
│      (todas as 519 permissões)          │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────────┐
│ Gestor │ │ Gestor │ │   Gestor   │
│   RH   │ │ Estoque│ │   Vendas   │
└────────┘ └────────┘ └────────────┘
    │            │            │
    ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────────┐
│Usuário │ │Usuário │ │  Usuário   │
│   RH   │ │Estoque │ │   Vendas   │
└────────┘ └────────┘ └────────────┘
```

### Verificação de Permissão

```typescript
// Middleware de verificação
const verifyPermission = createPermissionMiddleware({
  permission: 'stock.products.update',
})

// Middleware com escopo de recurso
const verifyScopedPermission = createScopeMiddleware({
  basePermissionCode: 'hr.employees.read',
  getResourceDepartmentId: async (request) => {
    const employee = await repo.findById(request.params.id)
    return employee?.departmentId ?? null
  },
})
```

## Sistema de Cache

### Estratégia de Cache

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CACHE LAYER (Redis)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  permissions:user:{userId}     TTL: 5min   - Permissões do usuário   │
│  session:{sessionId}           TTL: 30min  - Dados da sessão         │
│  user:{userId}                 TTL: 10min  - Dados básicos usuário   │
│  rate-limit:{ip}:{endpoint}    TTL: 1min   - Contadores rate limit   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Cache Service

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<void>
  invalidateUser(userId: string): Promise<void>
}
```

## Sistema de Filas (BullMQ)

### Filas Disponíveis

| Fila | Descrição | Concorrência |
|------|-----------|--------------|
| `notifications` | Notificações in-app | 10 |
| `emails` | Envio de emails | 5 |
| `audit-logs` | Gravação de audit logs | 20 |
| `reports` | Geração de relatórios | 2 |

### Estrutura de Job

```typescript
interface EmailJobData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
  }>
}

// Adicionar job à fila
await queueEmail({
  to: 'user@example.com',
  subject: 'Bem-vindo!',
  html: '<h1>Olá!</h1>',
})
```

## Monitoramento

### Health Checks

```typescript
// GET /health
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  uptime: number,
  version: string,
  checks: {
    database: { status: 'up' | 'down', responseTime: number },
    redis: { status: 'up' | 'down', responseTime: number },
    memory: { status: 'healthy' | 'warning', usage: object }
  }
}
```

### Logging

```typescript
// Logs estruturados com contexto
httpLogger.info({ requestId, userId, endpoint }, 'Request received')
dbLogger.warn({ query, duration }, 'Slow query detected')
errorLogger.error({ error, stack }, 'Unhandled error')
```

### Sentry Integration

- Captura automática de erros não tratados
- Filtro de erros esperados (401, 403, 404)
- Sanitização de dados sensíveis
- Performance monitoring

## Testes

### Estrutura de Testes

```
src/
├── use-cases/
│   └── stock/
│       └── products/
│           ├── create-product.ts
│           └── create-product.spec.ts      # Teste unitário
│
└── http/
    └── controllers/
        └── stock/
            └── products/
                ├── v1-create-product.controller.ts
                └── v1-create-product.e2e.spec.ts  # Teste E2E
```

### Testes Unitários

```typescript
describe('CreateProductUseCase', () => {
  let sut: CreateProductUseCase
  let productsRepository: InMemoryProductsRepository
  let categoriesRepository: InMemoryCategoriesRepository

  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository()
    categoriesRepository = new InMemoryCategoriesRepository()
    sut = new CreateProductUseCase(productsRepository, categoriesRepository)
  })

  it('should create a product', async () => {
    const category = makeCategory()
    categoriesRepository.items.push(category)

    const result = await sut.execute({
      name: 'Test Product',
      sku: 'TEST-001',
      categoryId: category.id.toString(),
    })

    expect(result.product).toBeDefined()
    expect(productsRepository.items).toHaveLength(1)
  })
})
```

### Testes E2E

```typescript
describe('Create Product (e2e)', () => {
  it('should create a product', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      permissions: ['stock.products.create'],
    })

    const response = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        sku: 'TEST-001',
        categoryId: 'category-id',
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
  })
})
```

## Convenções

### Nomenclatura

- **Arquivos:** kebab-case (`create-product.ts`)
- **Classes:** PascalCase (`CreateProductUseCase`)
- **Funções:** camelCase (`createProduct`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_ITEMS_PER_PAGE`)
- **Interfaces:** PascalCase com prefixo descritivo (`CreateProductRequest`)

### Commits

```
feat: add product creation endpoint
fix: correct SKU validation
refactor: extract product mapper
test: add unit tests for CreateProductUseCase
docs: update API documentation
chore: update dependencies
```

### Branches

```
feature/stock-products-crud
fix/auth-token-expiration
refactor/repository-pattern
```
