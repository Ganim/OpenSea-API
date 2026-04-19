---
name: Backend Architecture Patterns
description: Entity field chain, Prisma conventions, types architecture, E2E test performance
type: project
---

## Adding New Fields to a Backend Entity

Full chain (all layers must be updated):

1. `prisma/schema.prisma` - Add DB column
2. `npx prisma generate` + `npx prisma migrate dev --name <name>`
3. `src/entities/stock/<entity>.ts` - Props interface + getters/setters
4. `src/http/schemas/stock/<module>/<entity>.schema.ts` - Zod schemas (create, response, update)
5. `src/mappers/stock/<entity>/<entity>-to-dto.ts` - DTO mapping
6. `src/mappers/stock/<entity>/<entity>-prisma-to-domain.ts` - DB-to-entity mapping
7. `src/repositories/stock/<entity>-repository.ts` - Create/Update interfaces
8. `src/repositories/stock/prisma/prisma-<entity>-repository.ts` - ALL inline mappings
9. `src/repositories/stock/in-memory/in-memory-<entity>-repository.ts` - create + update
10. `src/use-cases/stock/<module>/create-<entity>.ts` - request interface
11. `src/use-cases/stock/<module>/update-<entity>.ts` - same

## Prisma Field Naming

- DB snake_case with `@map()`: `legal_name` → `legalName`, `zip_code` → `zipCode`
- `address` in Prisma maps to `addressLine1` in entity; `addressLine2` always `null`

## Frontend Types Architecture

- Modular under `src/types/{module}/` with barrel `index.ts`
- `generated/api-types.ts` REMOVED (Mar 2026) — 364KB useless `any` types
- Types must match backend Zod schemas; `updateSchema = createSchema.partial()`
- `no-explicit-any` is ESLint `error`

## E2E Test Performance (CRITICAL)

- Swagger + SwaggerUI MUST be disabled in test env (`app.ts` uses `isTestEnv`)
- Without this, `app.ready()` hangs >5min on Windows
- `pluginTimeout: 0` in test env; with fix: ~700ms

## Manufacturer Module

- Detail page: `/stock/manufacturers/[id]`
- Edit: manual form with useState (NOT EntityForm)
- Context menu: "Renomear" (uses RenameModal)
