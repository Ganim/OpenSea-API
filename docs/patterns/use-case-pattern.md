# Pattern: Use Case Pattern

## Problem

Em uma aplicação que cresce com múltiplos módulos (stock, hr, finance, calendar, storage, sales, rbac, audit), sem uma separação clara de responsabilidades:

- Controladores HTTP acumulam lógica de negócio, dificultando testes unitários
- Regras de negócio ficam acopladas ao framework web (Fastify), impedindo reutilização
- Não existe barreira que impeça a lógica de negócio de acessar diretamente a camada de dados
- Testar um fluxo completo exige subir um servidor HTTP real com banco de dados real

O Use Case Pattern resolve isso isolando **cada operação de negócio em uma classe independente**, com dependências injetadas via construtor, tornando cada use case 100% testável sem banco de dados e sem servidor HTTP.

---

## Solution

Cada use case é uma classe com um único método público `execute()`, que:

1. Recebe uma interface tipada `*UseCaseRequest` com todos os parâmetros necessários
2. Executa a regra de negócio (validações, chamadas ao repositório, transformações)
3. Retorna uma interface tipada `*UseCaseResponse` — ou lança um erro de domínio
4. Nunca depende de `FastifyRequest`, `FastifyReply`, Prisma diretamente, ou de qualquer framework

As dependências (repositórios, outros use cases, serviços) são injetadas pelo construtor, seguindo o princípio de inversão de dependência. Em produção, as instâncias concretas (Prisma) são montadas por funções `make-*.ts` (Factory Pattern). Em testes, repositórios in-memory são injetados.

```
Controller (HTTP Layer)
    │  chama
    ▼
Factory make-*UseCase()
    │  instancia
    ▼
UseCase.execute(request)       ← Application Layer
    │  usa interfaces
    ▼
Repository Interface           ← Domain Layer boundary
    │  implementado por
    ▼
PrismaRepository / InMemoryRepository  ← Infrastructure Layer
```

---

## Structure

### Anatomia de um Use Case

```typescript
// 1. Interface de entrada — todos os dados que o use case precisa
interface CreateProductUseCaseRequest {
  tenantId: string;       // sempre presente para isolamento multi-tenant
  name: string;
  description?: string;
  status?: string;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
  attributes?: Record<string, unknown>;
  categoryIds?: string[];
}

// 2. Interface de saída — o que o use case retorna em caso de sucesso
interface CreateProductUseCaseResponse {
  product: Product;       // entidade de domínio
}

// 3. Classe do use case — construtor injeta repositórios como interfaces
export class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private templatesRepository: TemplatesRepository,
    private suppliersRepository: SuppliersRepository,
    private manufacturersRepository: ManufacturersRepository,
    private categoriesRepository: CategoriesRepository,
  ) {}

  // 4. Método execute — único ponto de entrada
  async execute(
    request: CreateProductUseCaseRequest,
  ): Promise<CreateProductUseCaseResponse> {
    // 5. Lógica de negócio aqui
    // ...
    return { product: createdProduct };
  }
}
```

**Localização:** `src/use-cases/{module}/{resource}/{action}.ts`

Exemplos reais:
- `src/use-cases/stock/products/create-product.ts`
- `src/use-cases/calendar/events/create-calendar-event.ts`
- `src/use-cases/hr/employees/terminate-employee.ts`
- `src/use-cases/audit/log-audit.ts`

---

## Constructor Injection

O construtor recebe **interfaces de repositório**, nunca implementações concretas. Isso é o princípio da inversão de dependência aplicado de forma consistente em todo o projeto.

### Use case simples — um repositório

```typescript
// src/use-cases/stock/products/get-product-by-id.ts
export class GetProductByIdUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(request: GetProductByIdUseCaseRequest) {
    const product = await this.productsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );
    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }
    return { product };
  }
}
```

### Use case composto — múltiplos repositórios + outros use cases

```typescript
// src/use-cases/hr/employees/create-employee-with-user.ts
export class CreateEmployeeWithUserUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private createUserUseCase: CreateUserUseCase,        // outro use case!
    private usersRepository: UsersRepository,
    private tenantUsersRepository: TenantUsersRepository,
    private assignGroupToUserUseCase: AssignGroupToUserUseCase, // outro use case!
  ) {}
  // ...
}
```

### Use case com serviços externos (opcionais)

```typescript
// src/use-cases/storage/files/upload-file.ts
export class UploadFileUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private fileUploadService: FileUploadService,           // serviço S3/local
    private thumbnailService?: ThumbnailService,            // opcional
    private folderAccessService?: FolderAccessService,      // opcional (ACL)
    private encryptionService?: EncryptionService,          // opcional
  ) {}
}
```

Dependências opcionais (marcadas com `?`) são verificadas em runtime antes de serem usadas:
```typescript
if (this.thumbnailService?.canGenerate(file.mimetype)) {
  // gera thumbnail apenas se o serviço foi injetado
}
```

---

## Error Handling

Os use cases lançam **erros de domínio tipados** — nunca strings brutas ou `Error` genérico. A camada HTTP interpreta esses erros e retorna os status HTTP correspondentes.

### Hierarquia de erros de domínio

| Classe | HTTP Status | Quando usar |
|--------|-------------|-------------|
| `ResourceNotFoundError` | 404 | Recurso não encontrado (busca por ID, validação de FK) |
| `BadRequestError` | 400 | Dado inválido, regra de negócio violada, conflito de unicidade |
| `ForbiddenError` | 403 | Acesso negado (ownership, cross-tenant) |
| `UnauthorizedError` | 401 | Não autenticado |
| `PlanLimitExceededError` | 402 | Limite do plano atingido |
| `UserBlockedError` | 403 | Conta bloqueada por excesso de tentativas de login |
| `PasswordResetRequiredError` | 403 | Senha expirada, reset forçado pelo admin |

Todos os erros aceitam um `code?: ErrorCode` opcional (ver `src/@errors/error-codes.ts`), que é incluído na resposta JSON para que o frontend realize tratamento condicional por código:

```typescript
// src/@errors/use-cases/resource-not-found.ts
export class ResourceNotFoundError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Resource not found', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
```

### Padrão de uso nos use cases

```typescript
// Validação simples — sem código específico
if (!name || name.trim().length === 0) {
  throw new BadRequestError('Name is required');
}

// Validação com código de domínio específico
throw new BadRequestError(
  'Categorias se auto-referenciam',
  ErrorCodes.FINANCE_CATEGORY_SELF_REPLACEMENT,
);

// Recurso não encontrado
const product = await this.productsRepository.findById(id, tenantId);
if (!product) {
  throw new ResourceNotFoundError('Product not found');
}

// Limite de plano
throw new PlanLimitExceededError('produtos', 100);
// mensagem gerada: "Plan limit exceeded: maximum of 100 produtos allowed..."
```

### Erros que nunca devem ser propagados

O `LogAuditUseCase` é um caso especial: falhas de auditoria **nunca devem interromper a operação principal**. O use case captura internamente qualquer exceção:

```typescript
// src/use-cases/audit/log-audit.ts
async execute(request: LogAuditUseCaseRequest): Promise<void> {
  try {
    // ... registra log de auditoria
  } catch (error) {
    // Não propagar erros de auditoria para não interromper operação principal
    console.error('[AUDIT] Failed to log audit:', error);
  }
}
```

Da mesma forma, em `RespondToEventUseCase`, o envio de notificações é feito com `Promise.allSettled()` para nunca bloquear a resposta ao usuário:

```typescript
await Promise.allSettled([
  createFromTemplate.execute({ templateCode: 'calendar.event.rsvp' }),
  createFromTemplate.execute({ templateCode: 'calendar.event.rsvp.email' }),
]);
```

---

## Multi-Tenant Isolation

**Todo** use case que acessa dados de tenant **deve** receber `tenantId` no request e passá-lo em todas as queries ao repositório. Isso garante isolamento completo entre tenants.

### Fluxo do tenantId

```
JWT Token (tenantId + userId)
       ↓ extraído pelo middleware verifyTenant
Controller (request.user.tenantId)
       ↓ passado explicitamente
UseCase.execute({ tenantId, ... })
       ↓ passado em cada query
Repository.findById(id, tenantId)    ← WHERE id = ? AND tenantId = ?
```

### Exemplo: validação de foreign key com isolamento

```typescript
// src/use-cases/stock/products/create-product.ts
const template = await this.templatesRepository.findById(
  new UniqueEntityID(templateId),
  tenantId,   // ← garante que o template pertence ao mesmo tenant
);
if (!template) {
  throw new ResourceNotFoundError('Template not found');
}
```

Sem o `tenantId`, um tenant malicioso poderia referenciar templates de outro tenant.

### Admin use cases — sem tenantId

Use cases sob `src/use-cases/admin/` operam em nível de super admin e **não recebem tenantId** (ou recebem como parâmetro explícito de qual tenant está sendo gerenciado):

```typescript
// src/use-cases/admin/tenants/change-tenant-status.ts
interface ChangeTenantStatusUseCaseRequest {
  tenantId: string;  // qual tenant gerenciar — não é do JWT, é parâmetro de rota
  status: TenantStatus;
}
```

### Multi-tenant em RBAC — validação de ownership

```typescript
// src/use-cases/rbac/associations/assign-group-to-user.ts
if (tenantId) {
  const tenantIdEntity = new UniqueEntityID(tenantId);
  const isOwnedByTenant = group.tenantId?.equals(tenantIdEntity);
  const isGlobalGroup = group.tenantId === null; // grupos globais são visíveis a todos

  if (!isOwnedByTenant && !isGlobalGroup) {
    throw new ForbiddenError('Permission group does not belong to your tenant');
  }
}
```

---

## Pagination Pattern

Use cases de listagem seguem dois padrões de paginação, dependendo do módulo:

### Padrão 1 — `page` + `limit` (mais comum)

```typescript
// src/use-cases/audit/list-audit-logs.ts
interface ListAuditLogsUseCaseRequest {
  tenantId?: string;
  page?: number;
  limit?: number;
  // ... filtros
}

interface ListAuditLogsUseCaseResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Implementação típica com defaults
const page = request.page ?? 1;
const limit = request.limit ?? 20;
```

### Padrão 2 — `page` + `perPage` (HR, Admin)

```typescript
// src/use-cases/hr/employees/list-employees.ts
interface ListEmployeesRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  // ... filtros
}

interface ListEmployeesResponse {
  employees: Employee[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}
```

### Padrão 3 — `meta` como objeto aninhado (Calendar, Admin)

```typescript
// src/use-cases/calendar/events/list-calendar-events.ts
interface ListCalendarEventsResponse {
  events: CalendarEventDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;    // ← "pages" em vez de "totalPages"
  };
}
```

### Paginação com parallel queries

O padrão recomendado para paginação eficiente usa `Promise.all`:

```typescript
// src/use-cases/admin/tenants/list-all-tenants.ts
const [allTenants, totalTenants] = await Promise.all([
  this.tenantsRepository.findMany(page, perPage, filters),
  this.tenantsRepository.countAll(filters),
]);
```

---

## Factory Pattern

Cada use case tem um arquivo `make-*.ts` correspondente em `factories/`. A factory instancia as implementações concretas (Prisma) e monta o grafo de dependências — podendo compor outros use cases.

### Factory simples

```typescript
// src/use-cases/stock/products/factories/make-create-product-use-case.ts
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

### Factory composta — use case como dependência de outro use case

```typescript
// src/use-cases/hr/employees/factories/make-create-employee-with-user-use-case.ts
export function makeCreateEmployeeWithUserUseCase() {
  const employeesRepository = new PrismaEmployeesRepository();
  const usersRepository = new PrismaUsersRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();

  // CreateUserUseCase é injetado como dependência
  const createUserUseCase = new CreateUserUseCase(usersRepository);

  // AssignGroupToUserUseCase tem sua própria factory
  const assignGroupToUserUseCase = makeAssignGroupToUserUseCase();

  return new CreateEmployeeWithUserUseCase(
    employeesRepository,
    createUserUseCase,
    usersRepository,
    tenantUsersRepository,
    assignGroupToUserUseCase,
  );
}
```

### Factory com reutilização de use case

```typescript
// src/use-cases/core/auth/factories/make-authenticate-with-password-use-case.ts
export function makeAuthenticateWithPasswordUseCase() {
  const usersRepository = new PrismaUsersRepository();

  // Reutiliza a factory de outro use case
  const createSessionUseCase = makeCreateSessionUseCase();

  return new AuthenticateWithPasswordUseCase(
    usersRepository,
    createSessionUseCase,
  );
}
```

### Uso da factory no controller

```typescript
// src/http/controllers/stock/products/v1-create-product.controller.ts
handler: async (request, reply) => {
  const createProductUseCase = makeCreateProductUseCase();  // instanciado por request
  const { product } = await createProductUseCase.execute({ ... });
  // ...
}
```

A factory é chamada dentro do handler (por request), não como singleton global — exceto quando há estado gerenciado (ex: connection pools).

---

## Testing

### Unit tests — repositórios in-memory

Os testes unitários **nunca dependem de banco de dados**. Usam implementações in-memory que satisfazem as mesmas interfaces de repositório:

```typescript
// src/use-cases/stock/products/create-product.spec.ts
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { CreateProductUseCase } from './create-product';

let productsRepository: InMemoryProductsRepository;
let sut: CreateProductUseCase;   // "sut" = System Under Test (convenção do projeto)

const TENANT_ID = 'tenant-1';   // tenant fixo para testes de isolamento

describe('CreateProductUseCase', () => {
  beforeEach(() => {
    // Instanciação manual com repositórios in-memory
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();

    sut = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      // ... outros repositórios
    );
  });

  it('should create a product', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Laptop Dell Inspiron',
      templateId: template.id.toString(),
    });
    expect(result.product.name).toBe('Laptop Dell Inspiron');
  });

  it('should not create a product with empty name', async () => {
    await expect(
      sut.execute({ tenantId: TENANT_ID, name: '' }),
    ).rejects.toThrow(BadRequestError);
  });
});
```

### Convenções de test

| Convenção | Descrição |
|-----------|-----------|
| `let sut` | `sut` = System Under Test — variável que guarda a instância sendo testada |
| `TENANT_ID = 'tenant-1'` | Constante para testar isolamento entre tenants |
| `beforeEach` | Recria todos os repositórios antes de cada teste — garante isolamento |
| `rejects.toThrow(ErrorClass)` | Verifica o tipo do erro, não apenas a mensagem |
| `repository.items` | Acesso direto ao array in-memory para assertions de estado |

### InMemoryRepository — isolamento multi-tenant

Os repositórios in-memory replicam o filtro por `tenantId` que o Prisma faria:

```typescript
// src/repositories/stock/in-memory/in-memory-products-repository.ts
async findById(id: UniqueEntityID, tenantId: string): Promise<Product | null> {
  const product = this.items.find(
    (item) =>
      !item.deletedAt &&
      item.id.equals(id) &&
      item.tenantId.toString() === tenantId,  // ← isolamento tenant
  );
  return product ?? null;
}
```

### Factories de teste para E2E

Para testes E2E, existem funções utilitárias que criam dados diretamente via Prisma:

```typescript
// src/utils/tests/factories/stock/create-product.e2e.ts
export async function createProduct(override: CreateProductProps) {
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      tenantId: override.tenantId,
      name: override.name ?? `Test Product ${Date.now()}`,
      // ... campos obrigatórios preenchidos com defaults
    },
  });
  return { product, productId: product.id };
}
```

Para testes unitários, a factory auxiliar usa o próprio use case:

```typescript
// src/utils/tests/factories/core/make-user.ts
export async function makeUser({ email, password, usersRepository }) {
  const createUserUseCase = new CreateUserUseCase(usersRepository);
  return await createUserUseCase.execute({ email, password });
}
```

### E2E tests — servidor real com banco de dados

```
src/http/controllers/stock/products/v1-create-product.e2e.spec.ts
```

Os testes E2E sobem o servidor Fastify real e usam o banco de dados de teste, mas a lógica de negócio já foi validada nos unit tests — os E2E verificam apenas o contrato HTTP (status codes, schema de resposta, autenticação).

---

## Real Code Examples

### Exemplo 1 — CRUD simples (stock/products)

Quatro use cases, quatro classes:

| Use Case | Arquivo | Repositórios |
|----------|---------|-------------|
| `CreateProductUseCase` | `create-product.ts` | Products, Templates, Suppliers, Manufacturers, Categories |
| `GetProductByIdUseCase` | `get-product-by-id.ts` | Products |
| `UpdateProductUseCase` | `update-product.ts` | Products, Templates, Suppliers, Manufacturers, Categories |
| `DeleteProductUseCase` | `delete-product.ts` | Products |

### Exemplo 2 — Use case com estado de máquina (hr/employees)

`TerminateEmployeeUseCase` muda o status do funcionário e valida a transição de estado:

```typescript
// src/use-cases/hr/employees/terminate-employee.ts
if (employee.status.value === 'TERMINATED') {
  throw new Error('Employee is already terminated');  // impede dupla terminação
}

const updatedEmployee = await this.employeesRepository.update({
  id: new UniqueEntityID(employeeId),
  status: EmployeeStatus.TERMINATED(),
  terminationDate,
  metadata: {
    ...employee.metadata,
    terminationReason: reason,
    terminatedAt: new Date().toISOString(),
  },
});
```

### Exemplo 3 — Use case com regra de ownership (calendar/events)

`DeleteCalendarEventUseCase` implementa lógica de autorização baseada em autoria:

```typescript
// src/use-cases/calendar/events/delete-calendar-event.ts
if (event.isSystemEvent) {
  throw new BadRequestError('System events cannot be deleted');
}

if (
  event.createdBy.toString() !== request.userId &&
  !request.hasManagePermission
) {
  throw new BadRequestError('Only the event creator can delete this event');
}

await this.calendarEventsRepository.softDelete(request.id, request.tenantId);
```

### Exemplo 4 — Use case com expansão de dados (calendar/events list)

`ListCalendarEventsUseCase` injeta eventos sintéticos (feriados brasileiros) que não existem no banco:

```typescript
// src/use-cases/calendar/events/list-calendar-events.ts
// Eventos recorrentes são expandidos via RRULE
if (event.isRecurring && event.rrule) {
  const { RRule } = await import('rrule');
  const rule = new RRule({ ...options, dtstart: event.startDate });
  const occurrences = rule.between(startDate, endDate);
  for (const occurrence of occurrences) {
    result.push(calendarEventToDTO(event, { occurrenceDate: occurrence }));
  }
}

// Feriados brasileiros injetados sem persistência
const holidays = getHolidaysInRange(startDate, endDate);
for (const holiday of holidays) {
  result.push({ id: deterministicUUID(`holiday-${dateStr}`), type: 'HOLIDAY', ... });
}
```

### Exemplo 5 — Use case com sanitização de dados sensíveis (audit)

`LogAuditUseCase` sanitiza campos sensíveis antes de persistir:

```typescript
// src/use-cases/audit/log-audit.ts
private sanitizeData(data: Record<string, unknown> | null) {
  const sensitiveFields = [
    'password', 'passwordHash', 'token', 'accessToken',
    'refreshToken', 'apiKey', 'secret', 'privateKey',
    'creditCard', 'cvv', 'ssn',
  ];
  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
```

### Exemplo 6 — Use case com quota atomica (storage/upload)

`UploadFileUseCase` verifica quota de armazenamento de forma atômica para prevenir race conditions:

```typescript
// src/use-cases/storage/files/upload-file.ts
if (maxStorageBytes && maxStorageBytes > 0) {
  const withinQuota = await this.storageFilesRepository.atomicCheckQuota(
    tenantId,
    file.buffer.length,
    maxStorageBytes,
  );

  if (!withinQuota) {
    const limitMb = Math.round(maxStorageBytes / 1024 / 1024);
    throw new PlanLimitExceededError('MB de armazenamento', limitMb);
  }
}
```

### Exemplo 7 — Use case com autenticação e brute-force protection (core/auth)

`AuthenticateWithPasswordUseCase` implementa bloqueio progressivo por tentativas falhas:

```typescript
// src/use-cases/core/auth/authenticate-with-password.ts
if (!doesPasswordMatches) {
  existingUser.failedLoginAttempts += 1;

  if (existingUser.failedLoginAttempts >= MAX_ATTEMPTS) {
    existingUser.blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60 * 1000);
    await this.usersRepository.update({ id, blockedUntil, failedLoginAttempts });
    throw new UserBlockedError(existingUser.blockedUntil);
  }

  throw new BadRequestError('Invalid credentials');
}
```

---

## Files

### Localizações de use cases por módulo

```
src/use-cases/
  admin/
    companies/            # Empresas (super admin)
    dashboard/            # Dashboard administrativo
    plans/                # Planos de assinatura
    tenants/              # Gestão de tenants
  audit/                  # Log de auditoria
  calendar/
    events/               # Eventos, participantes, lembretes
  core/
    auth/                 # Autenticação (senha, PIN)
    me/                   # Perfil do usuário logado
    sessions/             # Sessões e refresh tokens
    teams/                # Equipes
    tenants/              # Seleção de tenant pelo usuário
    users/                # Criação e gestão de usuários
  email/                  # Contas de e-mail, mensagens
  finance/                # Entradas, categorias, bancos, empréstimos
  hr/
    absences/             # Ausências
    companies/            # Empresas do HR
    departments/          # Departamentos
    employees/            # Funcionários
    payrolls/             # Folha de pagamento
    work-schedules/       # Jornadas de trabalho
    # ... outros
  notifications/          # Criação e entrega de notificações
  rbac/
    associations/         # Atribuição de grupos e permissões
    permission-groups/    # Grupos de permissão
    permissions/          # Permissões individuais
  requests/               # Workflow de solicitações
  sales/
    customers/            # Clientes
    sales-orders/         # Pedidos de venda
    # ... outros
  storage/
    files/                # Upload, download, versões, trash
    folders/              # Pastas e hierarquia
    sharing/              # Links de compartilhamento
    # ... outros
  stock/
    products/             # Produtos
    variants/             # Variantes
    items/                # Itens de estoque
    warehouses/           # Armazéns
    # ... outros
```

---

## Rules

### Quando usar este padrão

- **Sempre.** Toda lógica de negócio deve residir em use cases. Controllers extraem dados do request, chamam o use case, e formatam a resposta.

### Quando NÃO colocar no use case

- Parsing de JSON, validação de schema HTTP → responsabilidade do Zod schema e do controller
- Serialização da resposta HTTP → responsabilidade do controller (usa mappers como `productToDTO`)
- Autenticação e autorização de rota → responsabilidade dos middlewares (`verifyJwt`, `verifyPermission`)
- Log de auditoria HTTP → responsabilidade do controller (chama `logAudit()` após o use case)

### Regras obrigatórias

1. **Um use case, uma responsabilidade.** Um use case cria produto, outro atualiza, outro deleta. Não combine operações em um único `execute()`.

2. **Interfaces como dependências.** O construtor recebe `ProductsRepository` (interface), nunca `PrismaProductsRepository` (implementação). Isso permite injetar repositórios in-memory nos testes.

3. **`tenantId` sempre no request.** Qualquer use case que acesse dados de tenant DEVE receber `tenantId` e passá-lo em todas as queries. Omitir o `tenantId` cria uma vulnerabilidade de cross-tenant.

4. **Erros de domínio tipados.** Nunca lance `new Error('message')` genérico — use `ResourceNotFoundError`, `BadRequestError`, etc. O controller usa `instanceof` para mapear ao status HTTP correto.

5. **Soft delete via repositório.** Use `softDelete()` que marca `deletedAt`, nunca delete físico diretamente. Exceção: `purge-deleted-files.ts` (garbage collector intencional).

6. **Retorne entidades ou DTOs, nunca objetos Prisma.** O use case retorna entidades de domínio (`Product`, `Employee`) ou DTOs (`CalendarEventDTO`, `TenantDTO`) — nunca o tipo raw do Prisma.

### Armadilhas comuns

- **Não acesse `prisma` diretamente no use case.** O acesso ao banco é responsabilidade exclusiva do repositório. Violar isso quebra a testabilidade.

- **Não injete `FastifyRequest` ou `FastifyReply`.** Se precisar de dados do request (IP, user agent), extraia-os no controller e passe como campos no request do use case. Exceção histórica: `AuthenticateWithPasswordUseCase` recebe `reply` para assinar o JWT — este é um tradeoff consciente documentado.

- **Não ignore erros de operações side-effect críticas.** Notificações podem ser `Promise.allSettled()`, mas operações core (criar user, salvar no banco) devem propagar erros. O padrão de swallow do `LogAuditUseCase` é específico para auditoria — não generalize.

- **Não reutilize instâncias entre requests.** As factories criam novas instâncias a cada request. Usar singleton pode causar vazamento de estado entre requests concorrentes.

- **Cuidado com loops e N+1.** Se o use case valida `categoryIds` em loop chamando o repositório para cada item, isso é um N+1. Para volumes pequenos é aceitável; para volumes grandes, use `findManyByIds()` no repositório.
