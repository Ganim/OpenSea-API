# Pattern: Testing Patterns

## Problem

O projeto OpenSea-API precisa garantir a qualidade de dois tipos distintos de lógica: regras de negócio isoladas (use cases, entidades, value objects) e comportamento HTTP completo com banco de dados real (controllers, auth, permissões). Cada tipo de lógica exige uma estratégia de teste diferente — velocidade e isolamento para unit tests, fidelidade completa para E2E tests.

---

## Solution

O projeto adota dois níveis de testes claramente separados:

1. **Testes unitários** (`*.spec.ts`) — testam use cases e entidades em memória, sem banco de dados, sem HTTP, usando repositórios in-memory que implementam as mesmas interfaces dos repositórios reais.
2. **Testes E2E** (`*.e2e.spec.ts`) — testam controllers via HTTP real (Fastify + Supertest) contra um schema PostgreSQL dedicado criado dinamicamente para cada execução.

A separação é física: arquivos `*.spec.ts` ficam junto aos use cases e entidades; arquivos `*.e2e.spec.ts` ficam junto aos controllers.

---

## Test Configuration

### Unit Tests — `vite.config.mjs`

```js
// vite.config.mjs (simplificado)
export default defineConfig({
  test: {
    globals: true,
    dir: 'src',
    coverage: {
      provider: 'v8',
      include: ['src/use-cases/**', 'src/entities/**', 'src/services/**'],
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 60,
        statements: 70,
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: [
            'src/use-cases/**/*.spec.ts',
            'src/entities/**/*.spec.ts',
            'src/repositories/**/*.spec.ts',
          ],
          exclude: ['**/*.e2e.spec.ts'],
        },
      },
    ],
  },
});
```

Testes unitários rodam em paralelo, sem setup de banco. O comando é `npm run test` (equivale a `vitest run --project unit`).

### E2E Tests — configuração dentro de `vite.config.mjs`

```js
{
  test: {
    name: 'e2e',
    dir: 'src/http/controllers',
    include: ['**/*.e2e.spec.ts'],
    setupFiles: ['./prisma/vitest-setup-e2e.ts'],
    testTimeout: 30000,
    hookTimeout: 300000,    // 5min para beforeAll/afterAll (migrate deploy)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,           // TODOS os specs num único processo fork
        execArgv: ['--stack-size=16384'],  // evita stack overflow do Fastify
      },
    },
    fileParallelism: false,  // arquivos sequenciais — evita contention do advisory lock do PostgreSQL
  },
}
```

**Por que `singleFork: true`?** O app Fastify é inicializado uma única vez pelo primeiro spec; specs subsequentes chamam `app.ready()` e retornam imediatamente. Sem isso, cada arquivo de teste criaria um cold-start de ~130 segundos.

**Por que `--stack-size=16384`?** O Fastify com ~450+ plugins registrados causa stack overflow durante a inicialização recursiva. O limite de 16MB evita esse problema.

O comando é `npm run test:e2e` (equivale a `vitest run --project e2e`).

### Arquivo de Setup E2E — `prisma/vitest-setup-e2e.ts`

Este arquivo é executado uma vez antes de todos os testes E2E. Ele cria um schema PostgreSQL dedicado e isolado, aplica as migrations, e registra um `afterAll` que destrói o schema ao final:

```ts
// prisma/vitest-setup-e2e.ts (resumo)
process.env.NODE_ENV = 'test';
process.env.SILENCE_RATE_LIMIT_LOGS = '1';

// Gera nome único: test_a1b2c3d4_e5f6_...
const schema = `test_${randomUUID().replace(/-/g, '_')}`;

// Altera DATABASE_URL para usar o schema dedicado
const testDatabaseUrl = generateDatabaseUrl(schema);
process.env.DATABASE_URL = testDatabaseUrl;

// Aplica migrations no schema de teste
await execFileAsync('npx', ['prisma', 'migrate', 'deploy'], {
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  shell: true,
});

// Cria o usuário de sistema necessário para o CalendarSyncService
await setupClient.user.create({
  data: {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'system@system.internal',
    password_hash: 'not-a-real-hash',
  },
});

// Cleanup: destroi o schema ao final de todos os testes
afterAll(async () => {
  await cleanupClient.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
  );
});
```

Cada execução de `npm run test:e2e` cria e destrói seu próprio schema, garantindo isolamento total entre execuções paralelas em CI.

---

## Unit Tests

### Estrutura

Os testes unitários ficam junto ao arquivo que testam:

```
src/use-cases/admin/companies/
  create-company.ts
  create-company.spec.ts     ← teste unitário
src/entities/rbac/value-objects/
  permission-code.ts
  permission-code.spec.ts
```

### Padrão SUT (System Under Test)

A convenção é declarar as dependências e o `sut` no escopo do `describe`, e recriá-los em `beforeEach`:

```ts
// src/use-cases/admin/companies/create-company.spec.ts
import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { CreateCompanyUseCase } from './create-company';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let sut: CreateCompanyUseCase;

describe('Admin - Create Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    sut = new CreateCompanyUseCase(companiesRepository);
  });

  it('should create a company successfully with minimal data', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    expect(result.company.legalName).toBe('Tech Solutions LTDA');
    expect(result.company.status).toBe('ACTIVE');
  });

  it('should not create company with existing CNPJ', async () => {
    await sut.execute({ tenantId: TENANT_ID, legalName: 'A', cnpj: '12345678000100' });

    await expect(
      sut.execute({ tenantId: TENANT_ID, legalName: 'B', cnpj: '12345678000100' }),
    ).rejects.toThrow('Company with this CNPJ already exists');
  });
});
```

### Cenários obrigatórios por use case

Todo use case deve ter testes cobrindo ao menos:

- Caso de sucesso com dados mínimos
- Caso de sucesso com todos os campos
- Regras de negócio violadas (duplicidade, data futura, formato inválido, etc.)
- Isolamento multi-tenant (registro de outro tenant não deve ser encontrado)

### Testes de entidade e value object

Entidades com lógica interna (value objects, state machines) têm testes próprios em `*.spec.ts` junto ao arquivo:

```ts
// src/entities/rbac/value-objects/permission-code.spec.ts
it('should accept valid permission code', () => {
  expect(() => new PermissionCode('stock.products.create')).not.toThrow();
});

it('should reject malformed code', () => {
  expect(() => new PermissionCode('invalid')).toThrow();
});
```

---

## E2E Tests

### Estrutura

Os testes E2E ficam junto aos controllers:

```
src/http/controllers/calendar/events/
  v1-create-calendar-event.controller.ts
  v1-create-calendar-event.e2e.spec.ts   ← teste E2E
```

### Padrão Lifecyle

Cada arquivo E2E usa `beforeAll`/`afterAll` para inicializar o app e criar o tenant de teste. O `tenantId` é compartilhado por todos os testes do arquivo:

```ts
// src/http/controllers/calendar/events/v1-create-calendar-event.e2e.spec.ts
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';

describe('Create Calendar Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create event with minimal fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reunião de Planejamento',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.event.title).toBe('Reunião de Planejamento');
  });
});
```

### Cenários obrigatórios por controller

Todo controller E2E deve ter testes cobrindo:

| Cenário | Status esperado |
|---------|----------------|
| Sucesso com dados mínimos | 201 ou 200 |
| Sucesso com todos os campos | 201 ou 200 |
| Dados inválidos (validação Zod) | 400 |
| Sem token JWT | 401 |
| Token válido mas sem permissão | 403 |
| Recurso não encontrado | 404 |
| Duplicidade (quando aplicável) | 400 ou 409 |

---

## Test Factories

As factories estão em `src/utils/tests/factories/` organizadas por módulo. Existem dois tipos:

### Tipo 1: Factory para unit tests — `make-*.ts`

Cria entidades de domínio diretamente, sem banco de dados. Aceita um objeto `override` com todos os campos opcionais; os campos não fornecidos recebem valores válidos via `@faker-js/faker`:

```ts
// src/utils/tests/factories/stock/make-variant.ts
export function makeVariant(override: MakeVariantProps = {}): Variant {
  const variantName = override.name ?? faker.commerce.productName();
  const uniqueSuffix = faker.string.alphanumeric(6);

  return Variant.create({
    tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
    sku: override.sku ?? faker.string.alphanumeric(10).toUpperCase(),
    name: variantName,
    price: override.price ?? Number(faker.commerce.price()),
    // ...
  }, new UniqueEntityID());
}
```

```ts
// src/utils/tests/factories/hr/make-employee.ts
export function makeEmployee(override: MakeEmployeeProps = {}): Employee {
  return Employee.create({
    tenantId: override.tenantId ?? new UniqueEntityID(),
    fullName: override.fullName ?? faker.person.fullName(),
    cpf: override.cpf ?? CPF.create(generateValidCPF()),
    // ... valores faker para todos os campos obrigatórios
  }, new UniqueEntityID());
}
```

### Tipo 2: Factory para E2E tests — `create-*.e2e.ts`

Persiste dados no banco de dados via Prisma diretamente. Útil para criar pré-condições sem passar pela API:

```ts
// src/utils/tests/factories/hr/create-employee.e2e.ts
export async function createEmployeeE2E(override: CreateEmployeeE2EProps = {}) {
  const employee = await prisma.employee.create({
    data: {
      tenantId: override.tenantId ?? (await createAutoTenant()),
      fullName: override.fullName ?? faker.person.fullName(),
      cpf: override.cpf ?? generateValidCPF(),
      hireDate: override.hireDate ?? faker.date.past({ years: 2 }),
      status: override.status ?? 'ACTIVE',
      // ...
    },
  });

  return { employee, employeeId: employee.id };
}
```

```ts
// src/utils/tests/factories/calendar/create-calendar-test-data.e2e.ts
export async function createCalendarEvent(
  tenantId: string,
  createdBy: string,
  overrides: CreateCalendarEventOptions = {},
) {
  const event = await prisma.calendarEvent.create({
    data: {
      tenantId,
      title: overrides.title ?? `Test Event ${Date.now()}`,
      startDate: overrides.startDate ?? new Date(Date.now() + 3_600_000),
      endDate: overrides.endDate ?? new Date(Date.now() + 7_200_000),
      // ...
    },
  });

  // Adiciona criador como participante OWNER automaticamente
  await prisma.eventParticipant.create({
    data: { tenantId, eventId: event.id, userId: createdBy, role: 'OWNER', status: 'ACCEPTED' },
  });

  return event;
}
```

### Geradores de documentos válidos

Para entidades que exigem CPF, CNPJ ou PIS válidos, há geradores com o algoritmo oficial:

```ts
// src/utils/tests/generators/cpf-generator.ts
CPFGenerator.generate()         // '52998224725'
CPFGenerator.generateFormatted() // '529.982.247-25'
CPFGenerator.generateUnique()   // baseado em timestamp, único por execução

// src/utils/tests/generators/cnpj-generator.ts
CNPJGenerator.generate()
```

Nas factories de `make-employee.ts` e `create-employee.e2e.ts`, a geração de CPF/PIS válido está embutida, sem depender de valores fixos.

---

## Auth Helper — `createAndAuthenticateUser`

A factory `createAndAuthenticateUser` é a principal utilitária para testes E2E com rotas protegidas. Ela:

1. Cria um usuário via use case `CreateUserUseCase`
2. Associa o usuário ao tenant (se `tenantId` fornecido)
3. Configura permissões RBAC (padrão: todas as permissões)
4. Faz login via `POST /v1/auth/login/password`
5. Seleciona o tenant via `POST /v1/auth/select-tenant` (se `tenantId` fornecido)
6. Retorna `{ user, token, refreshToken, sessionId }`

```ts
// Uso básico — usuário com todas as permissões, sem tenant
const { token } = await createAndAuthenticateUser(app);

// Com tenant — retorna JWT com escopo de tenant
const { token } = await createAndAuthenticateUser(app, { tenantId });

// Permissões específicas — para testar cenários granulares
const { token } = await createAndAuthenticateUser(app, {
  tenantId,
  permissions: ['stock.products.create', 'stock.products.read'],
});

// Sem permissões — para testar 403
const { token } = await createAndAuthenticateUser(app, {
  tenantId,
  permissions: [],
});
```

**Como as permissões são configuradas:** quando `permissions` é `undefined`, a factory cria todas as ~500 permissões definidas em `ALL_PERMISSIONS`, agrupa-as num grupo chamado `admin-test` e associa o usuário a esse grupo. Quando `permissions` é um array específico, cria um grupo temporário com apenas aquelas permissões.

### Super Admin — `createAndAuthenticateSuperAdmin`

Para rotas do painel `/v1/admin/*`, que exigem `isSuperAdmin: true`:

```ts
// src/utils/tests/factories/core/create-and-authenticate-super-admin.e2e.ts
export async function createAndAuthenticateSuperAdmin(app: FastifyInstance) {
  const createUserUseCase = makeCreateUserUseCase();
  const userResponse = await createUserUseCase.execute({ ... });

  // Promove o usuário para super admin diretamente no banco
  await prisma.user.update({
    where: { id: userId },
    data: { isSuperAdmin: true },
  });

  const { token } = (await request(app.server)
    .post('/v1/auth/login/password')
    .send({ ... })).body;

  return { user: userResponse, token };
}
```

### Tenant Setup — `createAndSetupTenant`

Cria um tenant diretamente no banco, com slug único para evitar conflitos:

```ts
// src/utils/tests/factories/core/create-and-setup-tenant.e2e.ts
export async function createAndSetupTenant(options = {}) {
  const slug = `test-tenant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const tenant = await prisma.tenant.create({
    data: { name: options.name ?? `Test Tenant ${Date.now()}`, slug, status: 'ACTIVE', ... },
  });
  return { tenant, tenantId: tenant.id };
}
```

---

## In-Memory Repositories

### Contrato

Cada repositório in-memory implementa a mesma interface TypeScript do repositório Prisma real. Isso garante que o use case não sabe que está sendo testado — ele programa contra a interface, não contra a implementação:

```
Interface (repository.ts)
  ↑ implements
  ├── InMemoryXxxRepository  ← unit tests
  └── PrismaXxxRepository   ← produção e E2E
```

### Estrutura interna

O array `items` é público para que os testes possam inspecionar o estado diretamente:

```ts
// src/repositories/calendar/in-memory/in-memory-calendar-events-repository.ts
export class InMemoryCalendarEventsRepository implements CalendarEventsRepository {
  public items: CalendarEvent[] = [];  // público para inspeção nos testes

  async create(data: CreateCalendarEventSchema): Promise<CalendarEvent> {
    const event = CalendarEvent.create({ /* ... */ });
    this.items.push(event);
    return event;
  }

  async findById(id: string, tenantId: string): Promise<CalendarEvent | null> {
    return this.items.find(
      (item) =>
        item.id.toString() === id &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,   // ← soft delete simulado
    ) ?? null;
  }
}
```

### Regras obrigatórias na implementação in-memory

| Regra | Por quê |
|-------|---------|
| Sempre filtrar por `tenantId` | Garante que o teste valide isolamento multi-tenant |
| Simular soft delete (`!item.deletedAt`) | Comportamento idêntico ao Prisma |
| Paginação real com `.slice()` | Evita que testes passem mas falhem em produção por quantidade |
| Array `items` público | Permite que testes verifiquem estado interno sem chamar `findMany` |

```ts
// Exemplo de paginação in-memory (src/repositories/hr/in-memory/in-memory-companies-repository.ts)
async findMany(params: FindManyCompaniesParams): Promise<FindManyCompaniesResult> {
  const { tenantId, page = 1, perPage = 20, search } = params;

  let filteredItems = this.items.filter(
    (item) => item.tenantId.toString() === tenantId && !item.deletedAt,
  );

  if (search) {
    filteredItems = filteredItems.filter(
      (item) => item.legalName.toLowerCase().includes(search.toLowerCase()),
    );
  }

  const total = filteredItems.length;
  const companies = filteredItems.slice((page - 1) * perPage, page * perPage);

  return { companies, total };
}
```

---

## Multi-Tenant Test Isolation

### Em testes unitários

O isolamento é simples: usa-se uma constante `TENANT_ID = 'tenant-1'` para todos os registros do teste. Se quiser testar que registros de outro tenant não aparecem, cria-se registros com `tenantId: 'tenant-2'` e verifica que não são retornados:

```ts
it('should reject calendarId from another tenant', async () => {
  const otherCalendar = await calendarsRepository.create({
    tenantId: 'tenant-2',  // ← tenant diferente
    name: 'Other',
    type: 'PERSONAL',
    createdBy: 'user-2',
  });

  await expect(
    sut.execute({
      tenantId: 'tenant-1',  // ← tenant atual
      calendarId: otherCalendar.id.toString(),
      title: 'Cross-tenant event',
      // ...
    }),
  ).rejects.toThrow('Calendar not found');
});
```

### Em testes E2E

O isolamento é automático porque cada spec cria seu próprio tenant via `createAndSetupTenant()`. Como o `tenantId` é um UUID gerado dinamicamente, dois specs nunca compartilham dados:

```ts
describe('Create Calendar Event (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant(); // UUID único
    tenantId = tid;
  });

  it('test A', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    // token contém tenantId no payload JWT → todos os requests ficam isolados
  });
});
```

O middleware `verifyTenant` na API valida o `tenantId` do JWT em cada request, garantindo que dados de um tenant nunca apareçam para outro — mesmo dentro do mesmo schema de teste.

---

## Coverage Configuration

A cobertura é medida apenas para as camadas de negócio (use cases, entidades, services):

```js
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: [
    'src/use-cases/**',
    'src/entities/**',
    'src/services/**',
  ],
  exclude: [
    '**/node_modules/**',
    '**/*.spec.ts',
    '**/*.e2e.spec.ts',
    '**/factories/**',
  ],
  thresholds: {
    lines: 70,
    functions: 65,
    branches: 60,
    statements: 70,
  },
},
```

Os controllers (HTTP layer) são excluídos da cobertura porque são cobertos pelos testes E2E, não pelos unitários. O comando para gerar o relatório é `npm run test:coverage`.

**Integração com CI:** o arquivo `.lcov` gerado em `coverage/lcov.info` é enviado ao Codecov. Se os thresholds não forem atingidos, o Vitest retorna exit code != 0 e o pipeline falha.

---

## Performance Tips

### Swagger desabilitado em testes

O Swagger (`@fastify/swagger` + `@fastify/swagger-ui`) é **explicitamente desabilitado** em ambiente de teste. Sem essa proteção, a compilação Zod-to-JSON-Schema trava o `app.ready()` por mais de 5 minutos em Windows:

```ts
// src/app.ts
const isTestEnv =
  env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  process.env.VITEST === '1';

const shouldEnableSwagger =
  !isTestEnv &&
  (env.NODE_ENV === 'production' || process.env.ENABLE_SWAGGER === 'true');

if (shouldEnableSwagger) {
  app.register(swagger, { ... });
}
```

Com essa guarda, `app.ready()` completa em ~700ms em vez de >5min.

### Rate limiting desabilitado em testes

Para evitar flakiness causado por rate limiting nos testes:

```ts
if (!isTestEnv) {
  app.register(rateLimit, rateLimitConfig.global);
}
```

### `pluginTimeout: 0` em testes

Em testes, o Fastify aguarda indefinidamente pela inicialização dos plugins. Em produção, o timeout é 5 minutos:

```ts
const pluginTimeout =
  process.env.NODE_ENV === 'test' || process.env.VITEST
    ? 0          // aguarda indefinidamente (lazy TypeScript transforms podem demorar)
    : 300_000;   // 5min em produção (Swagger compilation)
```

### `singleFork: true` + `fileParallelism: false`

O Vitest no modo E2E usa um único processo fork para todos os specs (`singleFork: true`). Isso evita que cada arquivo de teste inicialize o Fastify do zero. Os arquivos rodam sequencialmente (`fileParallelism: false`) para evitar contention do advisory lock do PostgreSQL durante `prisma migrate deploy`.

---

## Fakes para Services Externos

Quando um use case depende de um serviço externo (upload de arquivo, envio de email, etc.), o teste unitário usa uma implementação fake:

```ts
// src/utils/tests/fakes/fake-file-upload-service.ts
export class FakeFileUploadService implements FileUploadService {
  async upload(fileBuffer, fileName, mimeType, options): Promise<UploadResult> {
    return {
      key: `${options.prefix}/${fileName}`,
      url: `https://fake-storage.example.com/${options.prefix}/${fileName}`,
      size: fileBuffer.length,
      mimeType,
    };
  }

  async delete(_key: string): Promise<void> {}

  async initiateMultipartUpload(_fileName, _mimeType, _options) {
    return { uploadId: 'test-upload-id', key: 'test-key' };
  }
  // ...
}
```

O fake implementa a mesma interface do serviço real (`FileUploadService`) e retorna URLs previsíveis, sem fazer chamadas de rede.

---

## Load Tests

Para validação de desempenho sob carga, o projeto usa k6 com cenários em `tests/load/`:

```
tests/load/
  smoke.js              # Smoke test básico
  scenarios/
    auth-flow.js        # Fluxo de autenticação sob carga
    products-crud.js    # CRUD de produtos
    email-bulk-and-open.js
  k6.config.js
```

Comandos:
- `npm run test:load` — smoke test
- `npm run test:load:auth` — cenário de autenticação
- `npm run test:load:products` — cenário de estoque

Esses testes rodam separadamente da suíte Vitest e exigem o servidor em execução.

---

## Files

| Arquivo | Propósito |
|---------|-----------|
| `vite.config.mjs` | Configuração principal: projetos `unit` e `e2e`, coverage thresholds |
| `vitest.e2e.config.ts` | Config alternativa legada para execução standalone de E2E |
| `prisma/vitest-setup-e2e.ts` | Setup por execução: cria schema, aplica migrations, cleanup |
| `prisma/vitest-global-setup-e2e.ts` | Global setup (alternativo, não usado na config principal) |
| `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts` | Factory principal de auth para E2E |
| `src/utils/tests/factories/core/create-and-authenticate-super-admin.e2e.ts` | Factory de super admin para rotas `/v1/admin/*` |
| `src/utils/tests/factories/core/create-and-setup-tenant.e2e.ts` | Factory de tenant para E2E |
| `src/utils/tests/factories/hr/make-employee.ts` | Factory de entidade Employee para unit tests |
| `src/utils/tests/factories/stock/make-variant.ts` | Factory de entidade Variant para unit tests |
| `src/utils/tests/fakes/fake-file-upload-service.ts` | Fake do serviço de upload para unit tests |
| `src/utils/tests/generators/cpf-generator.ts` | Gerador de CPF válido |
| `src/utils/tests/generators/cnpj-generator.ts` | Gerador de CNPJ válido |

---

## Rules

### Quando usar testes unitários

- Para testar regras de negócio isoladas: validações, cálculos, invariantes de domínio
- Para testar value objects e entidades com estado
- Para testar múltiplos cenários de erro rapidamente (rodam em < 1s cada)

### Quando usar testes E2E

- Para testar o pipeline HTTP completo: parsing de request, validação Zod, permissão, resposta
- Para testar integração entre camadas (controller → use case → repositório → banco)
- Para testar comportamento de auth (401, 403, select-tenant)

### Quando usar cada tipo de factory

- `make-*.ts` → em testes `*.spec.ts` (unit), para criar entidades de domínio sem banco
- `create-*.e2e.ts` → em testes `*.e2e.spec.ts` (E2E), para inserir pré-condições no banco
- `generateEmployeeData()` / `generateOrganizationData()` → para gerar payloads de request sem persistir

### Armadilhas comuns

1. **Não misturar os dois tipos de setup.** Uma factory E2E (`create-*.e2e.ts`) usa Prisma e não pode ser chamada num teste unitário.

2. **`tenantId` constante em unit tests.** Nunca use UUID aleatório em unit tests — isso dificulta a leitura. Use `'tenant-1'` como constante.

3. **`app.close()` no `afterAll` dos E2E.** Sem isso, o processo do Vitest não termina. Como todos os specs compartilham o mesmo fork (`singleFork: true`), chamar `app.close()` em um spec pode afetar outros. O padrão estabelecido no projeto é chamar `app.close()` normalmente — o Fastify é resiliente a múltiplas chamadas.

4. **Testes com mais de 3 usuários.** Testes que criam muitos usuários (ex: testar convites de participantes de calendário) podem precisar de timeout individual maior (`{ timeout: 15000 }`), pois cada `createAndAuthenticateUser` faz uma cadeia de operações no banco.

5. **Não usar `--stack-size` no dev.** A flag `--stack-size=16384` é passada via `execArgv` no Vitest e via script `dev` do `package.json`. Não é necessário adicionar manualmente ao rodar os testes.

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| Nenhum registro. | | | |
