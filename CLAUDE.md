# OpenSea-API — Backend Instructions

## Commands

```bash
# Development
npm run dev                    # Start dev server with tsx watch (http://localhost:3333)

# Testing
npm run test                   # Run unit tests
npm run test:e2e               # Run E2E tests
npm run test:watch             # Unit tests in watch mode
npx vitest run path/to/test    # Run single test

# Code Quality
npm run lint                   # Check with ESLint
npm run lint:fix               # Auto-fix linting issues

# Database
docker-compose up -d           # Start PostgreSQL + Redis
npx prisma migrate dev         # Create and apply migrations
npx prisma studio              # Open Prisma Studio UI
npx prisma generate            # Generate Prisma Client

# Building
npm run build                  # Compile TypeScript (tsup)
npm start                      # Run production build
```

## Clean Architecture Layers

```
HTTP Layer (Controllers)      → Routes, Zod validation, middlewares
         ↓
Application Layer (Use Cases) → Business logic, services
         ↓
Domain Layer (Entities)       → Entities, Value Objects, domain errors
         ↓
Infrastructure Layer          → Prisma repositories, Redis, external services
```

## Key Patterns

- **Repository Pattern**: All data access through interfaces (`*Repository.ts`) with Prisma (`prisma/`) and in-memory (`in-memory/`) implementations
- **Use Case Pattern**: Business logic in `src/use-cases/{module}/{resource}/` with request/response interfaces
- **Factory Pattern**: Use case instantiation via `factories/make-*.ts`
- **Mapper Pattern**: Domain ↔ DTO ↔ Prisma conversions in `src/mappers/`
- **Value Objects**: Domain validation in entities (Email, CPF/CNPJ, ItemStatus, etc.)
- **TransactionManager**: `src/lib/transaction-manager.ts` — repositories accept optional `tx?: TransactionClient`

## API Pagination

All list endpoints use standardized pagination:

- Query params: `page` (default: 1), `limit` (default: 20, max: 100)
- Response: `{ data: [...], meta: { total, page, limit, pages } }`

## Controller Pattern

```typescript
export async function v1CreateProductController(app: FastifyInstance) {
  app.post('/v1/products', {
    schema: { tags: ['Products'], ... },
    preHandler: [verifyJwt, verifyPermission('stock.products.create')],
  }, async (request, reply) => { ... })
}
```

## Testing

- **Unit tests**: `*.spec.ts` alongside use cases, use in-memory repositories
- **E2E tests**: `*.e2e.spec.ts` alongside controllers, use real database
- Swagger + SwaggerUI MUST be disabled in test env (`app.ts` uses `isTestEnv` guard)

## Path Aliases

- `@/*` → `./src/*`
- `@prisma/generated/*` → `./prisma/generated/prisma/*`

## Key Files

| File                                     | Purpose                                             |
| ---------------------------------------- | --------------------------------------------------- |
| `prisma/schema.prisma`                   | Database schema (includes multi-tenant models)      |
| `prisma/seed.ts`                         | Database seed (superadmin, plans, demo tenant)      |
| `src/app.ts`                             | Fastify configuration                               |
| `src/http/routes.ts`                     | Route registration (includes admin + tenant routes) |
| `src/http/controllers/admin/routes.ts`   | Admin API routes (super admin only)                 |
| `src/constants/rbac/permission-codes.ts` | All permission codes                                |

## Multi-Tenant Admin API

All admin endpoints require `[verifyJwt, verifySuperAdmin]` and are prefixed with `/v1/admin/`.

### Tenant Management

| Method | Endpoint                              | Description                             |
| ------ | ------------------------------------- | --------------------------------------- |
| GET    | `/v1/admin/tenants`                   | List all tenants (paginated)            |
| GET    | `/v1/admin/tenants/:id`               | Get tenant details (plan, users, flags) |
| PATCH  | `/v1/admin/tenants/:id/status`        | Change tenant status                    |
| PATCH  | `/v1/admin/tenants/:id/plan`          | Change tenant plan                      |
| PATCH  | `/v1/admin/tenants/:id/feature-flags` | Toggle feature flags                    |
| GET    | `/v1/admin/tenants/:id/users`         | List tenant users                       |

### Plan Management

| Method | Endpoint                      | Description           |
| ------ | ----------------------------- | --------------------- |
| GET    | `/v1/admin/plans`             | List all plans        |
| GET    | `/v1/admin/plans/:id`         | Get plan with modules |
| POST   | `/v1/admin/plans`             | Create plan           |
| PUT    | `/v1/admin/plans/:id`         | Update plan           |
| DELETE | `/v1/admin/plans/:id`         | Deactivate plan       |
| PUT    | `/v1/admin/plans/:id/modules` | Set plan modules      |

### Tenant Auth (authenticated users)

| Method | Endpoint                 | Description                               |
| ------ | ------------------------ | ----------------------------------------- |
| GET    | `/v1/auth/tenants`       | List my tenants                           |
| POST   | `/v1/auth/select-tenant` | Select tenant (returns tenant-scoped JWT) |
