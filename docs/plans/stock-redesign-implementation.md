# Template & Product Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the template system with preset-based quick creation, expand product support beyond textiles, and restructure care instructions / attachments / variant fields.

**Architecture:** Incremental refactor of existing Clean Architecture. Database changes first (Prisma), then entities/mappers/repositories, then use cases/controllers, then frontend. Each chunk produces a compilable, testable backend before frontend work begins.

**Tech Stack:** TypeScript, Fastify, Prisma, PostgreSQL, Next.js 16, React 19, TailwindCSS 4, react-icons

**Spec:** `central-implementation/stock-redesign/template-product-redesign.md`

---

## Chunk 1: Database Schema & Core Backend Refactoring

This chunk handles all Prisma schema changes, entity refactoring, mapper updates, and repository updates. **Ambiente de dev — reset direto, sem migração de dados safe.**

### Task 1.1: Prisma Schema — ALL Schema Changes (single batch)

**Files:**
- Modify: `OpenSea-API/prisma/schema.prisma`

All schema changes applied together. Reset do banco se necessário.

- [ ] **Step 1: Expand UnitOfMeasure enum**

```prisma
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

- [ ] **Step 2: Add Pattern enum**

```prisma
enum Pattern {
  SOLID
  STRIPED
  PLAID
  PRINTED
  GRADIENT
  JACQUARD
}
```

- [ ] **Step 3: Modify Variant model**

Remove `imageUrl`. Add new fields:

```prisma
// REMOVE: imageUrl String? @db.VarChar(512)
// ADD (after colorPantone):
secondaryColorHex     String? @map("secondary_color_hex") @db.VarChar(7)
secondaryColorPantone String? @map("secondary_color_pantone") @db.VarChar(32)
pattern               Pattern?
```

- [ ] **Step 4: Modify Template model**

Remove `careLabel`. Add `specialModules`:

```prisma
// REMOVE: careLabel Json?
// ADD (after itemAttributes):
specialModules    String[] @default([]) @map("special_modules")
```

- [ ] **Step 5: Keep careInstructionIds on Product temporarily**

Do NOT remove `careInstructionIds` yet — keep it during migration transition. It will be removed in the data migration task.

- [ ] **Step 6: Add new tables**

Add `ProductCareInstruction`, `ProductAttachment`, `VariantAttachment` (see spec for full models). Add relations to Product, Variant, and Tenant models.

- [ ] **Step 7: Run prisma generate (NOT migrate yet)**

Run: `cd OpenSea-API && npx prisma generate`
Expected: Success.

- [ ] **Step 8: Commit**

```bash
cd OpenSea-API && git add prisma/schema.prisma && git commit -m "schema: all Prisma changes for template/product redesign (migration pending)"
```

---

### Task 1.2: Prisma Schema — Create New Tables

**Files:**
- Modify: `OpenSea-API/prisma/schema.prisma`

- [ ] **Step 1: Add ProductCareInstruction model**

```prisma
model ProductCareInstruction {
  id                String   @id @default(uuid())
  productId         String   @map("product_id")
  tenantId          String   @map("tenant_id")
  careInstructionId String   @map("care_instruction_id")
  order             Int      @default(0)
  createdAt         DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@unique([productId, careInstructionId])
  @@index([productId])
  @@index([tenantId])
  @@map("product_care_instructions")
}
```

- [ ] **Step 2: Add ProductAttachment model**

```prisma
model ProductAttachment {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  tenantId  String   @map("tenant_id")
  fileUrl   String   @map("file_url") @db.VarChar(512)
  fileName  String   @map("file_name") @db.VarChar(256)
  fileSize  Int      @map("file_size")
  mimeType  String   @map("mime_type") @db.VarChar(128)
  label     String?  @db.VarChar(128)
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@index([productId])
  @@index([tenantId])
  @@map("product_attachments")
}
```

- [ ] **Step 3: Add VariantAttachment model**

```prisma
model VariantAttachment {
  id        String   @id @default(uuid())
  variantId String   @map("variant_id")
  tenantId  String   @map("tenant_id")
  fileUrl   String   @map("file_url") @db.VarChar(512)
  fileName  String   @map("file_name") @db.VarChar(256)
  fileSize  Int      @map("file_size")
  mimeType  String   @map("mime_type") @db.VarChar(128)
  label     String?  @db.VarChar(128)
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  variant Variant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@index([variantId])
  @@index([tenantId])
  @@map("variant_attachments")
}
```

- [ ] **Step 4: Add relations to existing models**

Add to `Product` model:
```prisma
careInstructions  ProductCareInstruction[]
attachments       ProductAttachment[]
```

Add to `Variant` model:
```prisma
attachments       VariantAttachment[]
```

Add to `Tenant` model:
```prisma
productCareInstructions ProductCareInstruction[]
productAttachments      ProductAttachment[]
variantAttachments      VariantAttachment[]
```

- [ ] **Step 5: Run prisma generate**

Run: `cd OpenSea-API && npx prisma generate`
Expected: Success.

- [ ] **Step 6: Create migration**

Run: `cd OpenSea-API && npx prisma migrate dev --name template-product-redesign`
Expected: Migration created and applied.

- [ ] **Step 7: Commit**

```bash
cd OpenSea-API && git add prisma/ && git commit -m "schema: add ProductCareInstruction, ProductAttachment, VariantAttachment tables"
```

---

### Task 1.6: Refactor Template Entity

**Files:**
- Modify: `OpenSea-API/src/entities/stock/template.ts`

- [ ] **Step 1: Remove careLabel from Template Props interface**

Remove `careLabel?: CareLabelInfo` and the `CareLabelInfo` interface/import if it's local. Add `specialModules` to Props:

```typescript
// In TemplateProps interface:
// REMOVE: careLabel?: CareLabelInfo
// ADD:
specialModules: string[]  // e.g., ['CARE_INSTRUCTIONS']
```

- [ ] **Step 2: Remove careLabel getter/setter, add specialModules getter/setter**

Remove `get careLabel()`, `set careLabel()`, `get hasCareLabel()`. Add:

```typescript
get specialModules(): string[] {
  return this.props.specialModules
}

set specialModules(modules: string[]) {
  this.props.specialModules = modules
  this.touch()
}

hasSpecialModule(module: string): boolean {
  return this.props.specialModules.includes(module)
}
```

- [ ] **Step 3: Update constructor default**

In `create()` static or constructor, set default: `specialModules: props.specialModules ?? []`

- [ ] **Step 4: Verify compilation**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | head -20`
Expected: May have errors in other files that reference careLabel — that's expected, we'll fix those next.

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add src/entities/stock/template.ts && git commit -m "entity: refactor Template - remove careLabel, add specialModules"
```

---

### Task 1.7: Refactor Product Entity

**Files:**
- Modify: `OpenSea-API/src/entities/stock/product.ts`
- Delete: `OpenSea-API/src/entities/stock/value-objects/care-instructions.ts`

- [ ] **Step 1: Remove careInstructions from Product Props**

Remove `careInstructions` / `careInstructionIds` from the Props interface. Remove all `import` of `CareInstructions` value object.

Remove getters/setters: `get careInstructions()`, `set careInstructions()`, `get hasCareInstructions()`, `get careInstructionIds()`.

- [ ] **Step 2: Update constructor**

Remove any initialization of `careInstructions` / `careInstructionIds` from `create()` or constructor.

- [ ] **Step 3: Delete CareInstructions value object**

Delete file: `src/entities/stock/value-objects/care-instructions.ts`

Check if it's re-exported from an index file and remove that export too.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add -A src/entities/stock/ && git commit -m "entity: remove careInstructions from Product, delete CareInstructions value object"
```

---

### Task 1.8: Refactor Variant Entity

**Files:**
- Modify: `OpenSea-API/src/entities/stock/variant.ts`

- [ ] **Step 1: Remove imageUrl, add new fields to Props**

```typescript
// REMOVE from VariantProps:
// imageUrl?: string

// ADD to VariantProps:
secondaryColorHex?: string
secondaryColorPantone?: string
pattern?: string  // Pattern enum value
```

- [ ] **Step 2: Remove imageUrl getter/setter, add new getters/setters**

Remove `get imageUrl()`, `set imageUrl()`. Add:

```typescript
get secondaryColorHex(): string | undefined {
  return this.props.secondaryColorHex
}

set secondaryColorHex(value: string | undefined) {
  this.props.secondaryColorHex = value
  this.touch()
}

get secondaryColorPantone(): string | undefined {
  return this.props.secondaryColorPantone
}

set secondaryColorPantone(value: string | undefined) {
  this.props.secondaryColorPantone = value
  this.touch()
}

get pattern(): string | undefined {
  return this.props.pattern
}

set pattern(value: string | undefined) {
  this.props.pattern = value
  this.touch()
}
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/entities/stock/variant.ts && git commit -m "entity: remove imageUrl from Variant, add secondaryColor and pattern"
```

---

### Task 1.9: Update Zod Schemas

**Files:**
- Modify: `OpenSea-API/src/http/schemas/stock/templates/template.schema.ts`
- Modify: `OpenSea-API/src/http/schemas/stock/products/product.schema.ts`
- Modify: `OpenSea-API/src/http/schemas/stock/variants/variant.schema.ts`

- [ ] **Step 1: Update template schema**

Remove `careLabel` / `careLabelSchema` from create and response schemas. Add `specialModules`:

```typescript
// In createTemplateSchema:
specialModules: z.array(z.enum(['CARE_INSTRUCTIONS'])).optional().default([]),

// In templateResponseSchema:
specialModules: z.array(z.string()),
```

Update `unitOfMeasure` to include all 10 values:
```typescript
unitOfMeasure: z.enum([
  'UNITS', 'METERS', 'KILOGRAMS', 'GRAMS', 'LITERS',
  'MILLILITERS', 'SQUARE_METERS', 'PAIRS', 'BOXES', 'PACKS'
]).optional().default('UNITS'),
```

- [ ] **Step 2: Update product schema**

Remove `careInstructionIds` from create/update/response schemas.

- [ ] **Step 3: Update variant schema**

Remove `imageUrl`. Add new fields:

```typescript
// In createVariantSchema:
secondaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
secondaryColorPantone: z.string().max(32).optional(),
pattern: z.enum(['SOLID', 'STRIPED', 'PLAID', 'PRINTED', 'GRADIENT', 'JACQUARD']).optional(),
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/http/schemas/stock/ && git commit -m "schema: update Zod schemas for template/product/variant redesign"
```

---

### Task 1.10: Update Mappers — Template

**Files:**
- Modify: `OpenSea-API/src/mappers/stock/template/template-to-dto.ts`
- Modify: `OpenSea-API/src/mappers/stock/template/template-prisma-to-domain.ts`

- [ ] **Step 1: Update TemplateDTO**

Remove `careLabel` from DTO interface. Add `specialModules: string[]`.

- [ ] **Step 2: Update templateToDTO function**

Replace `careLabel: template.careLabel ?? null` with `specialModules: template.specialModules`.

- [ ] **Step 3: Update prisma-to-domain mapper**

Remove careLabel mapping from Prisma result. Add:

```typescript
specialModules: raw.specialModules ?? [],
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/mappers/stock/template/ && git commit -m "mapper: update Template mappers - remove careLabel, add specialModules"
```

---

### Task 1.11: Update Mappers — Product

**Files:**
- Modify: `OpenSea-API/src/mappers/stock/product/product-to-dto.ts`
- Modify: `OpenSea-API/src/mappers/stock/product/product-prisma-to-domain.ts`

- [ ] **Step 1: Remove careInstructionIds from ProductDTO and mappings**

Remove from interface, from `productToDTO()`, and from `productPrismaToDomain()`.

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add src/mappers/stock/product/ && git commit -m "mapper: remove careInstructionIds from Product mappers"
```

---

### Task 1.12: Update Mappers — Variant

**Files:**
- Modify: `OpenSea-API/src/mappers/stock/variant/variant-to-dto.ts`
- Modify: `OpenSea-API/src/mappers/stock/variant/variant-prisma-to-domain.ts`

- [ ] **Step 1: Remove imageUrl, add new fields**

In VariantDTO: remove `imageUrl`, add `secondaryColorHex`, `secondaryColorPantone`, `pattern`.

In `variantToDTO()`: update the mapping.

In `variantPrismaToDomain()`: remove imageUrl, add new field mappings.

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add src/mappers/stock/variant/ && git commit -m "mapper: update Variant mappers - remove imageUrl, add pattern and secondaryColor"
```

---

### Task 1.13: Update Repositories — Template

**Files:**
- Modify: `OpenSea-API/src/repositories/stock/templates-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/prisma/prisma-templates-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/in-memory/in-memory-templates-repository.ts`

- [ ] **Step 1: Update repository interface**

In CreateTemplateSchema/UpdateTemplateSchema: remove `careLabel`, add `specialModules: string[]`.

- [ ] **Step 2: Update Prisma repository**

In ALL inline mappings (create, findById, findMany, update, etc.): remove careLabel, add specialModules.

- [ ] **Step 3: Update in-memory repository**

Same changes as Prisma repo but in the in-memory data structures.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/repositories/stock/*template* && git commit -m "repo: update Template repositories - remove careLabel, add specialModules"
```

---

### Task 1.14: Update Repositories — Product

**Files:**
- Modify: `OpenSea-API/src/repositories/stock/products-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/prisma/prisma-products-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/in-memory/in-memory-products-repository.ts`

- [ ] **Step 1: Remove careInstructionIds from all repository interfaces and implementations**

Remove from CreateProductSchema, UpdateProductSchema, all inline mappings.

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add src/repositories/stock/*product* && git commit -m "repo: remove careInstructionIds from Product repositories"
```

---

### Task 1.15: Update Repositories — Variant

**Files:**
- Modify: `OpenSea-API/src/repositories/stock/variants-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/prisma/prisma-variants-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/in-memory/in-memory-variants-repository.ts`

- [ ] **Step 1: Remove imageUrl, add new fields**

In CreateVariantSchema/UpdateVariantSchema: remove `imageUrl`, add `secondaryColorHex`, `secondaryColorPantone`, `pattern`.

Update all inline mappings in Prisma and in-memory repos.

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add src/repositories/stock/*variant* && git commit -m "repo: update Variant repositories - remove imageUrl, add pattern and secondaryColor"
```

---

### Task 1.16: Update Existing Use Cases

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/templates/create-template.ts`
- Modify: `OpenSea-API/src/use-cases/stock/templates/update-template.ts`
- Modify: `OpenSea-API/src/use-cases/stock/products/create-product.ts`
- Modify: `OpenSea-API/src/use-cases/stock/products/update-product.ts`
- Modify: `OpenSea-API/src/use-cases/stock/variants/create-variant.ts`
- Modify: `OpenSea-API/src/use-cases/stock/variants/update-variant.ts`
- Delete: `OpenSea-API/src/use-cases/stock/products/set-product-care-instructions.ts`
- Delete: `OpenSea-API/src/use-cases/stock/products/factories/make-set-product-care-instructions-use-case.ts`

- [ ] **Step 1: Update create-template use case**

Remove `careLabel` from request interface. Add `specialModules?: string[]` with default `[]`.
Pass `specialModules` to repository create call.

- [ ] **Step 2: Update update-template use case**

Same — remove careLabel handling, add specialModules.

- [ ] **Step 3: Update create-product use case**

Remove `careInstructionIds` from request interface. Remove CareInstructions value object usage.

- [ ] **Step 4: Update update-product use case**

Remove careInstructionIds handling.

- [ ] **Step 5: Delete set-product-care-instructions use case + factory**

Delete both files.

- [ ] **Step 6: Update create-variant use case**

Remove `imageUrl` from request. Add `secondaryColorHex`, `secondaryColorPantone`, `pattern`.

- [ ] **Step 7: Update update-variant use case**

Same changes as create.

- [ ] **Step 8: Verify compilation**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30`
Expected: May have controller errors (next chunk), but entity/use-case layer should be clean.

- [ ] **Step 9: Commit**

```bash
cd OpenSea-API && git add -A src/use-cases/stock/ && git commit -m "use-case: update template/product/variant use cases for redesign"
```

---

### Task 1.17: Update Existing Controllers & Remove set-product-care Controller

**Files:**
- Modify: `OpenSea-API/src/http/controllers/stock/templates/v1-create-template.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/templates/v1-update-template.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/products/v1-create-product.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/products/v1-update-product.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/variants/v1-create-variant.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/variants/v1-update-variant.controller.ts`
- Delete: `OpenSea-API/src/http/controllers/stock/care/v1-set-product-care.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/stock/care/routes.ts`

- [ ] **Step 1: Update template controllers**

Update create/update to pass `specialModules` instead of `careLabel`. Update Swagger schema references.

- [ ] **Step 2: Update product controllers**

Remove `careInstructionIds` from request body destructuring and use case calls.

- [ ] **Step 3: Update variant controllers**

Remove `imageUrl`, add `secondaryColorHex`, `secondaryColorPantone`, `pattern`.

- [ ] **Step 4: Delete set-product-care controller**

Delete `v1-set-product-care.controller.ts`. Remove its route from `care/routes.ts`.

- [ ] **Step 5: Verify full compilation**

Run: `cd OpenSea-API && npx tsc --noEmit`
Expected: Success (0 errors).

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add -A src/http/controllers/stock/ && git commit -m "controller: update template/product/variant controllers for redesign"
```

---

### Task 1.18: Add Permission Codes + Seed Update

**Files:**
- Modify: `OpenSea-API/src/constants/rbac/permission-codes.ts`
- Modify: `OpenSea-API/prisma/seed.ts`

- [ ] **Step 1: Add new permission codes**

Add to the stock section:

```typescript
// Product Care Instructions
'stock.product-care-instructions.create',
'stock.product-care-instructions.read',
'stock.product-care-instructions.delete',

// Product Attachments
'stock.product-attachments.create',
'stock.product-attachments.read',
'stock.product-attachments.delete',

// Variant Attachments
'stock.variant-attachments.create',
'stock.variant-attachments.read',
'stock.variant-attachments.delete',
```

- [ ] **Step 2: Update seed to insert new permissions**

In `prisma/seed.ts`, ensure the new 9 permission codes are seeded into the `Permission` table, following the existing seeding pattern. Without this, `verifyPermission()` middleware will reject all requests in fresh/production databases.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/constants/rbac/permission-codes.ts prisma/seed.ts && git commit -m "rbac: add permission codes for care instructions, product/variant attachments + seed"
```

---

### Task 1.19: Update Existing Unit Tests

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/templates/create-template.spec.ts`
- Modify: `OpenSea-API/src/use-cases/stock/templates/update-template.spec.ts`
- Modify: `OpenSea-API/src/use-cases/stock/products/create-product.spec.ts`
- Modify: `OpenSea-API/src/use-cases/stock/products/update-product.spec.ts`
- Delete: `OpenSea-API/src/use-cases/stock/products/set-product-care-instructions.spec.ts`
- Modify: `OpenSea-API/src/use-cases/stock/variants/create-variant.spec.ts`
- Modify: `OpenSea-API/src/use-cases/stock/variants/update-variant.spec.ts`

- [ ] **Step 1: Update template tests**

Remove references to `careLabel` in test payloads. Add `specialModules` where appropriate:

```typescript
// In create-template tests, replace careLabel usage with:
specialModules: ['CARE_INSTRUCTIONS'],
```

- [ ] **Step 2: Update product tests**

Remove `careInstructionIds` from all test payloads and assertions.

- [ ] **Step 3: Delete set-product-care-instructions.spec.ts**

Delete the test file.

- [ ] **Step 4: Update variant tests**

Remove `imageUrl`. Add `secondaryColorHex`, `secondaryColorPantone`, `pattern` to create/update test payloads.

- [ ] **Step 5: Run unit tests**

Run: `cd OpenSea-API && npx vitest run src/use-cases/stock/templates/ src/use-cases/stock/products/ src/use-cases/stock/variants/`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add -A src/use-cases/stock/ && git commit -m "test: update existing unit tests for template/product/variant redesign"
```

---

### Task 1.20: Update Existing E2E Tests

**Files:**
- Modify: All E2E tests in `OpenSea-API/src/http/controllers/stock/templates/`
- Modify: All E2E tests in `OpenSea-API/src/http/controllers/stock/products/`
- Modify: All E2E tests in `OpenSea-API/src/http/controllers/stock/variants/`
- Delete: `OpenSea-API/src/http/controllers/stock/care/v1-set-product-care.e2e.spec.ts`

- [ ] **Step 1: Update template E2E tests**

Remove `careLabel` from payloads and assertions. Add `specialModules` where needed.

- [ ] **Step 2: Update product E2E tests**

Remove `careInstructionIds` from all payloads and assertions.

- [ ] **Step 3: Delete set-product-care E2E test**

- [ ] **Step 4: Update variant E2E tests**

Remove `imageUrl`. Add new fields to payloads.

- [ ] **Step 5: Run E2E tests**

Run: `cd OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/templates/ src/http/controllers/stock/products/ src/http/controllers/stock/variants/`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add -A src/http/controllers/stock/ && git commit -m "test: update E2E tests for template/product/variant redesign"
```

---

## Chunk 2: New Use Cases, Controllers & Tests

This chunk creates the new CRUD for ProductCareInstruction, ProductAttachment, and VariantAttachment.

### Task 2.1: ProductCareInstruction Repository

**Files:**
- Create: `OpenSea-API/src/repositories/stock/product-care-instructions-repository.ts`
- Create: `OpenSea-API/src/repositories/stock/prisma/prisma-product-care-instructions-repository.ts`
- Create: `OpenSea-API/src/repositories/stock/in-memory/in-memory-product-care-instructions-repository.ts`

- [ ] **Step 1: Create repository interface**

```typescript
export interface CreateProductCareInstructionData {
  productId: string
  tenantId: string
  careInstructionId: string
  order?: number
}

export interface ProductCareInstructionsRepository {
  create(data: CreateProductCareInstructionData): Promise<ProductCareInstruction>
  findByProductId(productId: string): Promise<ProductCareInstruction[]>
  findById(id: string): Promise<ProductCareInstruction | null>
  delete(id: string): Promise<void>
  deleteByProductIdAndCareId(productId: string, careInstructionId: string): Promise<void>
}
```

- [ ] **Step 2: Create Prisma implementation**

Implement all methods using Prisma Client. Order by `order` ASC in `findByProductId`.

- [ ] **Step 3: Create in-memory implementation**

Implement all methods using array storage.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/repositories/stock/*care-instruction* && git commit -m "repo: add ProductCareInstruction repository (interface, prisma, in-memory)"
```

---

### Task 2.2: ProductCareInstruction Use Cases + Tests

**Files:**
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/create-product-care-instruction.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/list-product-care-instructions.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/delete-product-care-instruction.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/create-product-care-instruction.spec.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/list-product-care-instructions.spec.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/delete-product-care-instruction.spec.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/factories/make-create-product-care-instruction-use-case.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/factories/make-list-product-care-instructions-use-case.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-care-instructions/factories/make-delete-product-care-instruction-use-case.ts`

- [ ] **Step 1: Write create use case test**

Test: creates a care instruction for a product, validates careInstructionId via CareCatalogProvider, rejects duplicates, rejects invalid care IDs.

- [ ] **Step 2: Implement create use case**

Validates: product exists, careInstructionId is valid (CareCatalogProvider), product's template has `CARE_INSTRUCTIONS` in specialModules, no duplicate.

- [ ] **Step 3: Run test**

Run: `cd OpenSea-API && npx vitest run src/use-cases/stock/product-care-instructions/create-product-care-instruction.spec.ts`
Expected: PASS.

- [ ] **Step 4: Write list use case test + implementation**

List all care instructions for a product, ordered by `order`.

- [ ] **Step 5: Write delete use case test + implementation**

Delete by ID. Verify product belongs to tenant.

- [ ] **Step 6: Create factories**

Follow existing pattern: inject Prisma repository and CareCatalogProvider.

- [ ] **Step 7: Run all care instruction tests**

Run: `cd OpenSea-API && npx vitest run src/use-cases/stock/product-care-instructions/`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
cd OpenSea-API && git add src/use-cases/stock/product-care-instructions/ && git commit -m "use-case: add ProductCareInstruction CRUD (create, list, delete) with tests"
```

---

### Task 2.3: ProductAttachment Repository + Use Cases + Tests

**Files:**
- Create: `OpenSea-API/src/repositories/stock/product-attachments-repository.ts`
- Create: `OpenSea-API/src/repositories/stock/prisma/prisma-product-attachments-repository.ts`
- Create: `OpenSea-API/src/repositories/stock/in-memory/in-memory-product-attachments-repository.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-attachments/create-product-attachment.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-attachments/list-product-attachments.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-attachments/delete-product-attachment.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-attachments/*.spec.ts`
- Create: `OpenSea-API/src/use-cases/stock/product-attachments/factories/make-*.ts`

- [ ] **Step 1: Create repository (interface + prisma + in-memory)**

Fields: `productId, tenantId, fileUrl, fileName, fileSize, mimeType, label?, order`.

- [ ] **Step 2: Write tests and implement create, list, delete use cases**

Create: validates product exists, stores attachment metadata.
List: by productId, ordered by `order`.
Delete: by ID, also deletes file from Storage via StorageService.

- [ ] **Step 3: Create factories**

- [ ] **Step 4: Run tests**

Run: `cd OpenSea-API && npx vitest run src/use-cases/stock/product-attachments/`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add src/repositories/stock/*attachment* src/use-cases/stock/product-attachments/ && git commit -m "feat: add ProductAttachment CRUD (repository, use cases, tests)"
```

---

### Task 2.4: VariantAttachment Repository + Use Cases + Tests

**Files:**
- Create: `OpenSea-API/src/repositories/stock/variant-attachments-repository.ts`
- Create: `OpenSea-API/src/repositories/stock/prisma/prisma-variant-attachments-repository.ts`
- Create: `OpenSea-API/src/repositories/stock/in-memory/in-memory-variant-attachments-repository.ts`
- Create: `OpenSea-API/src/use-cases/stock/variant-attachments/create-variant-attachment.ts`
- Create: `OpenSea-API/src/use-cases/stock/variant-attachments/list-variant-attachments.ts`
- Create: `OpenSea-API/src/use-cases/stock/variant-attachments/delete-variant-attachment.ts`
- Create: `OpenSea-API/src/use-cases/stock/variant-attachments/*.spec.ts`
- Create: `OpenSea-API/src/use-cases/stock/variant-attachments/factories/make-*.ts`

- [ ] **Step 1-5: Same pattern as Task 2.3 but for variants**

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add src/repositories/stock/*variant-attachment* src/use-cases/stock/variant-attachments/ && git commit -m "feat: add VariantAttachment CRUD (repository, use cases, tests)"
```

---

### Task 2.5: Zod Schemas for New Endpoints

**Files:**
- Create: `OpenSea-API/src/http/schemas/stock/product-care-instructions/product-care-instruction.schema.ts`
- Create: `OpenSea-API/src/http/schemas/stock/product-care-instructions/index.ts`
- Create: `OpenSea-API/src/http/schemas/stock/attachments/attachment.schema.ts`
- Create: `OpenSea-API/src/http/schemas/stock/attachments/index.ts`

- [ ] **Step 1: Create care instruction schemas**

```typescript
export const createProductCareInstructionSchema = z.object({
  careInstructionId: z.string().min(1),
  order: z.number().int().min(0).optional().default(0),
})

export const productCareInstructionResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  careInstructionId: z.string(),
  order: z.number(),
  createdAt: z.date(),
})
```

- [ ] **Step 2: Create attachment schemas**

```typescript
export const attachmentResponseSchema = z.object({
  id: z.string().uuid(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  label: z.string().nullable(),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/http/schemas/stock/product-care-instructions/ src/http/schemas/stock/attachments/ && git commit -m "schema: add Zod schemas for care instructions and attachments endpoints"
```

---

### Task 2.6: Controllers for ProductCareInstruction

**Files:**
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/v1-create-product-care-instruction.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/v1-list-product-care-instructions.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/v1-delete-product-care-instruction.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/routes.ts`

- [ ] **Step 1: Create controllers**

Follow existing controller pattern:
- POST `/v1/products/:productId/care-instructions` → create
- GET `/v1/products/:productId/care-instructions` → list
- DELETE `/v1/products/:productId/care-instructions/:id` → delete

All use `[verifyJwt, verifyTenant, verifyPermission('stock.product-care-instructions.{action}')]`.

- [ ] **Step 2: Create routes.ts**

Register all 3 controllers.

- [ ] **Step 3: Register in main routes**

Modify `OpenSea-API/src/http/routes.ts` to import and register care instruction routes.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/product-care-instructions/ src/http/routes.ts && git commit -m "controller: add ProductCareInstruction endpoints (create, list, delete)"
```

---

### Task 2.7: Controllers for ProductAttachment

**Files:**
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/v1-create-product-attachment.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/v1-list-product-attachments.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/v1-delete-product-attachment.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/routes.ts`

- [ ] **Step 1: Create controllers**

- POST `/v1/products/:productId/attachments` → multipart upload (use `@fastify/multipart`)
- GET `/v1/products/:productId/attachments` → list
- DELETE `/v1/products/:productId/attachments/:id` → delete (also removes from Storage)

- [ ] **Step 2: Register in main routes**

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/product-attachments/ src/http/routes.ts && git commit -m "controller: add ProductAttachment endpoints (upload, list, delete)"
```

---

### Task 2.8: Controllers for VariantAttachment

**Files:**
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/v1-create-variant-attachment.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/v1-list-variant-attachments.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/v1-delete-variant-attachment.controller.ts`
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/routes.ts`

- [ ] **Step 1-3: Same pattern as Task 2.7 but for variants**

Routes: `/v1/variants/:variantId/attachments`

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/variant-attachments/ src/http/routes.ts && git commit -m "controller: add VariantAttachment endpoints (upload, list, delete)"
```

---

### Task 2.9: E2E Tests for New Endpoints

**Files:**
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/v1-create-product-care-instruction.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/v1-list-product-care-instructions.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-care-instructions/v1-delete-product-care-instruction.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/v1-create-product-attachment.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/v1-list-product-attachments.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/product-attachments/v1-delete-product-attachment.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/v1-create-variant-attachment.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/v1-list-variant-attachments.e2e.spec.ts`
- Create: `OpenSea-API/src/http/controllers/stock/variant-attachments/v1-delete-variant-attachment.e2e.spec.ts`

- [ ] **Step 1: Write care instruction E2E tests**

Test scenarios:
- Create: success, invalid care ID, duplicate, template without CARE_INSTRUCTIONS module
- List: returns ordered, empty for no instructions
- Delete: success, not found

- [ ] **Step 2: Write product attachment E2E tests**

Test scenarios:
- Create: upload file, verify metadata stored
- List: returns attachments in order
- Delete: removes record and verifies

- [ ] **Step 3: Write variant attachment E2E tests**

Same pattern as product attachments.

- [ ] **Step 4: Run all new E2E tests**

Run: `cd OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/product-care-instructions/ src/http/controllers/stock/product-attachments/ src/http/controllers/stock/variant-attachments/`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/product-care-instructions/*.e2e.spec.ts src/http/controllers/stock/product-attachments/*.e2e.spec.ts src/http/controllers/stock/variant-attachments/*.e2e.spec.ts && git commit -m "test: add E2E tests for care instructions, product/variant attachments"
```

---

### Task 2.10: Full Backend Test Suite Verification

- [ ] **Step 1: Run ALL unit tests**

Run: `cd OpenSea-API && npx vitest run`
Expected: All pass (including existing 569+ tests).

- [ ] **Step 2: Run ALL E2E tests**

Run: `cd OpenSea-API && npx vitest run --config vitest.e2e.config.ts`
Expected: All pass (including existing 285+ tests).

- [ ] **Step 3: Commit any remaining fixes**

---

## Chunk 3: Frontend Types, Presets & Data

This chunk updates frontend types to match the backend changes and creates the template presets data file.

### Task 3.1: Update Frontend Types — Template

**Files:**
- Modify: `OpenSea-APP/src/types/stock/template.types.ts`

- [ ] **Step 1: Remove CareLabel from Template type, add specialModules**

```typescript
// REMOVE from Template interface:
// careLabel?: CareLabel | null

// ADD:
specialModules: string[]
```

- [ ] **Step 2: Update CreateTemplateRequest and UpdateTemplateRequest**

Remove `careLabel`, add `specialModules?: string[]`.

- [ ] **Step 3: Expand UnitOfMeasure type**

```typescript
export type UnitOfMeasure =
  | 'UNITS' | 'METERS' | 'KILOGRAMS' | 'GRAMS'
  | 'LITERS' | 'MILLILITERS' | 'SQUARE_METERS'
  | 'PAIRS' | 'BOXES' | 'PACKS'
```

- [ ] **Step 4: Add UnitOfMeasure label map**

```typescript
export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  UNITS: 'Unidades (un)',
  METERS: 'Metros (m)',
  KILOGRAMS: 'Quilogramas (kg)',
  GRAMS: 'Gramas (g)',
  LITERS: 'Litros (L)',
  MILLILITERS: 'Mililitros (mL)',
  SQUARE_METERS: 'Metros quadrados (m²)',
  PAIRS: 'Pares (par)',
  BOXES: 'Caixas (cx)',
  PACKS: 'Pacotes (pct)',
}
```

- [ ] **Step 5: Commit**

```bash
cd OpenSea-APP && git add src/types/stock/template.types.ts && git commit -m "types: update Template types - remove careLabel, add specialModules, expand UoM"
```

---

### Task 3.2: Update Frontend Types — Product & Variant

**Files:**
- Modify: `OpenSea-APP/src/types/stock/product.types.ts`
- Modify: `OpenSea-APP/src/types/stock/variant.types.ts`

- [ ] **Step 1: Remove careInstructionIds from Product type**

Remove from `Product` interface and `CreateProductRequest`.

- [ ] **Step 2: Update Variant type**

Remove `imageUrl`. Add:

```typescript
secondaryColorHex?: string
secondaryColorPantone?: string
pattern?: Pattern
```

- [ ] **Step 3: Add Pattern type**

```typescript
export type Pattern = 'SOLID' | 'STRIPED' | 'PLAID' | 'PRINTED' | 'GRADIENT' | 'JACQUARD'

export const PATTERN_LABELS: Record<Pattern, string> = {
  SOLID: 'Sólido',
  STRIPED: 'Listrado',
  PLAID: 'Xadrez',
  PRINTED: 'Estampado',
  GRADIENT: 'Degradê',
  JACQUARD: 'Jacquard',
}
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/types/stock/product.types.ts src/types/stock/variant.types.ts && git commit -m "types: update Product and Variant types for redesign"
```

---

### Task 3.3: Create New Frontend Types — Attachments & CareInstruction

**Files:**
- Create: `OpenSea-APP/src/types/stock/attachment.types.ts`
- Create: `OpenSea-APP/src/types/stock/product-care-instruction.types.ts`
- Modify: `OpenSea-APP/src/types/stock/index.ts`

- [ ] **Step 1: Create attachment types**

```typescript
export interface Attachment {
  id: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  label?: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateAttachmentRequest {
  file: File
  label?: string
}
```

- [ ] **Step 2: Create ProductCareInstruction type**

```typescript
export interface ProductCareInstruction {
  id: string
  productId: string
  careInstructionId: string
  order: number
  createdAt: string
}

export interface CreateProductCareInstructionRequest {
  careInstructionId: string
  order?: number
}
```

- [ ] **Step 3: Update barrel exports**

Add `export * from './attachment.types'` and `export * from './product-care-instruction.types'` to `src/types/stock/index.ts`.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/types/stock/ && git commit -m "types: add Attachment and ProductCareInstruction types"
```

---

### Task 3.4: Create Template Presets Data File

**Files:**
- Create: `OpenSea-APP/src/data/template-presets.ts`

- [ ] **Step 1: Create the file with all types and preset category labels**

Define `PresetCategory`, `TemplatePreset` interface, `PRESET_CATEGORY_LABELS` map.

- [ ] **Step 2: Add all ~20 presets organized by category**

Implement every preset from the spec document (Seção 5 do design). Each preset includes:
- `id` (slug), `name`, `description`, `icon` (react-icons name), `category`
- `unitOfMeasure`, `specialModules`
- `productAttributes`, `variantAttributes`, `itemAttributes` (using the TemplateAttributes format)

The file exports:
```typescript
export const TEMPLATE_PRESETS: TemplatePreset[]
export const PRESETS_BY_CATEGORY: Record<PresetCategory, TemplatePreset[]>
export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string>
```

- [ ] **Step 3: Verify types compile**

Run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors in preset file.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/data/template-presets.ts && git commit -m "feat: add template presets data file with ~20 pre-configured templates"
```

---

## Chunk 4: Frontend UI — Template Creation Modal

This chunk redesigns the template creation modal with preset grid and preview.

### Task 4.1: Refactor Template Creation Modal — Preset Grid

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/page.tsx` (or the create modal component)
- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/src/components/preset-grid.tsx`
- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/src/components/preset-card.tsx`

- [ ] **Step 1: Create PresetCard component**

Card with: icon (react-icons), name, description. onClick selects preset.

- [ ] **Step 2: Create PresetGrid component**

Tabs by category (using Tabs from shadcn). Each tab shows grid of PresetCards. Below grid: full-width button "Configurar um Novo Template".

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/app/\(dashboard\)/\(modules\)/stock/\(entities\)/templates/src/components/ && git commit -m "feat: add PresetGrid and PresetCard components for template creation"
```

---

### Task 4.2: Preset Preview & Quick Create Form

**Files:**
- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/src/components/preset-preview.tsx`
- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/src/components/quick-create-form.tsx`

- [ ] **Step 1: Create PresetPreview component**

Shows: header with back arrow + preset name, collapsible sections for UoM, special modules, product/variant/item attributes. Footer: "Adicionar Template" button (w-full, primary).

- [ ] **Step 2: Create QuickCreateForm component**

Simple form: Name input + UnitOfMeasure select. "Criar Template" button. Creates empty template.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/app/\(dashboard\)/\(modules\)/stock/\(entities\)/templates/src/components/ && git commit -m "feat: add PresetPreview and QuickCreateForm components"
```

---

### Task 4.3: Integrate New Modal Flow

**Files:**
- Modify: The create template modal (likely `OpenSea-APP/src/components/modals/create-template-modal.tsx` or similar)

- [ ] **Step 1: Replace old modal content with new 3-state flow**

States: `'grid' | 'preview' | 'manual'`
- `grid`: renders PresetGrid
- `preview`: renders PresetPreview (with selected preset)
- `manual`: renders QuickCreateForm

- [ ] **Step 2: Wire up API calls**

When creating from preset: POST `/v1/templates` with preset data (name, unitOfMeasure, specialModules, productAttributes, variantAttributes, itemAttributes).

When creating manually: POST `/v1/templates` with just name + unitOfMeasure.

Both close modal on success + invalidate templates query.

- [ ] **Step 3: Verify flow**

Run dev server and test: open modal → see presets → click one → see preview → click "Adicionar Template" → modal closes → template appears in list.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/ && git commit -m "feat: redesign template creation modal with preset grid, preview, and manual create"
```

---

## Chunk 5: Frontend UI — Variant, Care Instructions & Attachments

### Task 5.1: Update Variant Form — New Fields

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/variant-form-modal.tsx`
- Modify: `OpenSea-APP/src/components/stock/variants/variant-form.tsx`

- [ ] **Step 1: Remove imageUrl field from form**

Replace the imageUrl text input with a note that images are managed in the Images section (VariantImage).

- [ ] **Step 2: Add secondary color fields**

In the "Basic" section, add secondaryColorHex and secondaryColorPantone inputs (same pattern as primary color).

- [ ] **Step 3: Add Pattern selector**

Add a Select dropdown with Pattern options (using PATTERN_LABELS). Include visual preview of each pattern.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/ && git commit -m "feat: update variant form with pattern, secondary color; remove imageUrl"
```

---

### Task 5.2: Variant Image Upload Integration

**Files:**
- Modify: Variant form modal or create a new `VariantImageUploader` component
- Create: `OpenSea-APP/src/hooks/stock/use-variant-images.ts`

- [ ] **Step 1: Create useVariantImages hook**

CRUD hook for VariantImage using Storage/File Manager upload. Manages isPrimary, order, drag reorder.

- [ ] **Step 2: Create VariantImageUploader component**

Grid of image thumbnails with: upload button, drag-to-reorder, set primary, delete. Uses the Storage upload endpoint with path `/tenants/{tenantId}/products/{productSlug}/variants/{variantSlug}/images/`.

- [ ] **Step 3: Integrate into variant form modal**

Add as a new section in the sidebar navigation.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/ && git commit -m "feat: add variant image upload via Storage with drag-reorder and primary selection"
```

---

### Task 5.3: Pattern Visual Component

**Files:**
- Create: `OpenSea-APP/src/components/stock/variants/pattern-display.tsx`

- [ ] **Step 1: Create PatternDisplay component**

Renders a small visual representation of the pattern using CSS:
- SOLID: single color fill
- STRIPED: CSS repeating-linear-gradient (horizontal stripes with primary + secondary color)
- PLAID: CSS grid of crossed stripes
- PRINTED: dotted/scattered pattern
- GRADIENT: linear-gradient from primary to secondary color
- JACQUARD: woven texture pattern

Props: `pattern`, `colorHex`, `secondaryColorHex`, `size` (sm/md/lg).

- [ ] **Step 2: Integrate into variant list rows**

Replace the solid color circle with PatternDisplay where applicable.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add src/components/stock/variants/pattern-display.tsx && git commit -m "feat: add PatternDisplay component with CSS pattern rendering"
```

---

### Task 5.4: Care Instructions UI on Product Page

**Files:**
- Create: `OpenSea-APP/src/hooks/stock/use-product-care-instructions.ts`
- Create: `OpenSea-APP/src/components/stock/products/care-instructions-section.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/products/[id]/page.tsx`

- [ ] **Step 1: Create useProductCareInstructions hook**

React Query hook for the new endpoints:
- GET `/v1/products/:productId/care-instructions`
- POST `/v1/products/:productId/care-instructions`
- DELETE `/v1/products/:productId/care-instructions/:id`

- [ ] **Step 2: Create CareInstructionsSection component**

Shows care icons in a grid. "Adicionar" button opens the existing CareSelector component. Delete button per instruction.

Only renders if product's template has `CARE_INSTRUCTIONS` in specialModules.

- [ ] **Step 3: Integrate into product detail page**

Add CareInstructionsSection below product info, conditionally rendered.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/ && git commit -m "feat: add care instructions section to product page using new API"
```

---

### Task 5.5: Attachments UI — Product & Variant

**Files:**
- Create: `OpenSea-APP/src/hooks/stock/use-product-attachments.ts`
- Create: `OpenSea-APP/src/hooks/stock/use-variant-attachments.ts`
- Create: `OpenSea-APP/src/components/stock/attachments/attachment-list.tsx`
- Create: `OpenSea-APP/src/components/stock/attachments/attachment-upload.tsx`
- Modify: Product detail page
- Modify: Variant form modal

- [ ] **Step 1: Create hooks**

React Query hooks for both product and variant attachments (create via multipart upload, list, delete).

- [ ] **Step 2: Create AttachmentList component**

Reusable list showing: file icon (by mimeType), fileName, fileSize (formatted), label badge, download link, delete button.

- [ ] **Step 3: Create AttachmentUpload component**

Drag-and-drop zone + file picker. Optional label input. Uploads via Storage and creates attachment record.

- [ ] **Step 4: Integrate into product detail page**

Add "Documentos" section below care instructions.

- [ ] **Step 5: Integrate into variant form modal**

Add "Anexos" section in sidebar navigation.

- [ ] **Step 6: Commit**

```bash
cd OpenSea-APP && git add src/ && git commit -m "feat: add attachment upload and list UI for products and variants"
```

---

### Task 5.6: Update Template Edit Page

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/[id]/edit/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/templates/src/components/template-form.tsx`

- [ ] **Step 1: Remove careLabel section from template form**

Remove any care label / fiber composition fields.

- [ ] **Step 2: Add specialModules section**

Checkboxes or multi-select for available modules. V1: only "Conservação Têxtil" (CARE_INSTRUCTIONS).

- [ ] **Step 3: Update UnitOfMeasure selector**

Show all 10 options with proper labels.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add src/app/\(dashboard\)/\(modules\)/stock/\(entities\)/templates/ && git commit -m "feat: update template edit form - remove careLabel, add specialModules, expand UoM"
```

---

### Task 5.7: Final Frontend Verification

- [ ] **Step 1: Run lint**

Run: `cd OpenSea-APP && npm run lint`
Expected: No errors.

- [ ] **Step 2: Run build**

Run: `cd OpenSea-APP && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual smoke test**

1. Open template creation modal → verify preset grid appears
2. Select a preset → verify preview shows attributes
3. Click "Adicionar Template" → verify template created
4. Create product with new template → verify attributes form
5. Add care instructions to product → verify icons appear
6. Upload attachment to product → verify in list
7. Create variant → verify pattern selector and secondary color
8. Upload variant images → verify grid with reorder

- [ ] **Step 4: Final commit**

```bash
cd OpenSea-APP && git add -A && git commit -m "chore: final cleanup and verification for template/product redesign"
```

---

## Chunk 6: Data Migration & Column Cleanup

**CRITICAL:** Tasks 1.1 intentionally kept `imageUrl` on Variant and `careInstructionIds` on Product to preserve data during migration. This chunk migrates the data, then drops the deprecated columns in a final migration.

### Task 6.1: Write and Run Data Migration Script

**Files:**
- Create: `OpenSea-API/prisma/migrations/scripts/migrate-care-instructions-and-images.ts`

- [ ] **Step 1: Write migration script**

```typescript
// 1. Migrate careInstructionIds → ProductCareInstruction
// For each Product with non-empty careInstructionIds:
//   For each string in array (at index i):
//     If CareCatalogProvider.exists(id):
//       INSERT INTO product_care_instructions (id, product_id, tenant_id, care_instruction_id, order)
//       VALUES (uuid(), product.id, product.tenantId, careId, i)
//     Else: skip invalid ID (log warning)

// 2. Migrate Variant.imageUrl → VariantImage
// For each Variant with non-null imageUrl:
//   If NOT EXISTS VariantImage WHERE variantId = variant.id:
//     INSERT INTO variant_images (id, variant_id, url, is_primary, order)
//     VALUES (uuid(), variant.id, imageUrl, true, 0)
//   Else: skip (variant already has images)
```

- [ ] **Step 2: Test migration locally**

Run against local database. Verify:
- ProductCareInstruction rows match original careInstructionIds arrays
- VariantImage rows created for variants that had imageUrl but no existing images

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add prisma/migrations/scripts/ && git commit -m "migration: data migration scripts for care instructions and variant images"
```

---

### Task 6.2: Drop Deprecated Columns

**Files:**
- Modify: `OpenSea-API/prisma/schema.prisma`

- [ ] **Step 1: Remove imageUrl from Variant model**

```prisma
// REMOVE: imageUrl String? @db.VarChar(512)
```

- [ ] **Step 2: Remove careInstructionIds from Product model**

```prisma
// REMOVE: careInstructionIds String[] @default([]) @map("care_instruction_ids")
```

- [ ] **Step 3: Create migration**

Run: `cd OpenSea-API && npx prisma migrate dev --name drop-deprecated-columns`
Expected: Migration drops the 2 columns.

- [ ] **Step 4: Run full test suite to verify nothing references dropped columns**

Run: `cd OpenSea-API && npx vitest run && npx vitest run --config vitest.e2e.config.ts`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add prisma/ && git commit -m "schema: drop deprecated imageUrl and careInstructionIds columns after data migration"
```

---

### Task 6.3: Storage Path Utility

**Files:**
- Create: `OpenSea-API/src/utils/storage-paths.ts`

- [ ] **Step 1: Create utility for generating slug-based storage paths**

```typescript
export function productStoragePath(tenantId: string, productSlug: string): string {
  return `/tenants/${tenantId}/products/${productSlug}`
}

export function variantImagesPath(tenantId: string, productSlug: string, variantSlug: string): string {
  return `/tenants/${tenantId}/products/${productSlug}/variants/${variantSlug}/images`
}

export function productAttachmentsPath(tenantId: string, productSlug: string): string {
  return `/tenants/${tenantId}/products/${productSlug}/attachments`
}

export function variantAttachmentsPath(tenantId: string, productSlug: string, variantSlug: string): string {
  return `/tenants/${tenantId}/products/${productSlug}/variants/${variantSlug}/attachments`
}
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add src/utils/storage-paths.ts && git commit -m "util: add slug-based storage path generation utility"
```
