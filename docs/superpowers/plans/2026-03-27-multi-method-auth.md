# Multi-Method Authentication — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a multi-method login system (Email/CPF/Matrícula/Magic Link) with AuthLink model, tenant-level configuration, credential management in profile/admin/HR/central, and full backward compatibility with existing email+password login.

**Architecture:** New `AuthLink` table stores login method bindings per user (provider + identifier + credential). `TenantAuthConfig` controls which methods each tenant allows. Login resolves identifiers via AuthLink instead of User.email directly. Existing endpoints remain backward-compatible via aliasing.

**Tech Stack:** TypeScript, Fastify, Prisma, PostgreSQL, bcrypt, nodemailer, React 19, Next.js 16, TailwindCSS 4, TanStack Query/Form

**Spec:** `docs/superpowers/specs/2026-03-27-multi-method-auth-design.md`

---

## Phase 1: Foundation — Schema, Entities, Repositories

### Task 1: Prisma Schema — New Models

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add AuthLinkProvider and AuthLinkStatus enums + AuthLink model**

```prisma
enum AuthLinkProvider {
  EMAIL
  CPF
  ENROLLMENT
  GOOGLE
  MICROSOFT
  APPLE
  GITHUB
}

enum AuthLinkStatus {
  ACTIVE
  INACTIVE
}

model AuthLink {
  id         String           @id @default(uuid())
  userId     String
  tenantId   String?
  provider   AuthLinkProvider
  identifier String           @db.VarChar(320)
  credential String?          @db.VarChar(100)
  metadata   Json?
  status     AuthLinkStatus   @default(ACTIVE)
  linkedAt   DateTime         @default(now())
  unlinkedAt DateTime?
  lastUsedAt DateTime?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant? @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@unique([provider, identifier, unlinkedAt], name: "auth_links_provider_identifier_unique_active")
  @@index([userId, status])
  @@index([identifier])
  @@index([tenantId])
  @@map("auth_links")
}
```

- [ ] **Step 2: Add TenantAuthConfig model**

```prisma
model TenantAuthConfig {
  id                 String   @id @default(uuid())
  tenantId           String   @unique
  allowedMethods     Json     @default("[\"EMAIL\"]")
  magicLinkEnabled   Boolean  @default(false)
  magicLinkExpiresIn Int      @default(15)
  defaultMethod      String?  @db.VarChar(32)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("tenant_auth_configs")
}
```

- [ ] **Step 3: Add MagicLinkToken model**

```prisma
model MagicLinkToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @db.VarChar(64)
  email     String    @db.VarChar(254)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("magic_link_tokens")
}
```

- [ ] **Step 4: Add relations to User and Tenant models**

Add to User model:

```prisma
authLinks      AuthLink[]
magicLinkTokens MagicLinkToken[]
```

Add to Tenant model:

```prisma
authLinks       AuthLink[]
tenantAuthConfig TenantAuthConfig?
```

- [ ] **Step 5: Make User.password_hash nullable**

Change:

```prisma
// FROM
password_hash String @db.VarChar(100)
// TO
password_hash String? @db.VarChar(100)
```

- [ ] **Step 6: Run prisma generate to validate schema**

Run: `npx prisma generate`
Expected: Success, no errors

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(auth): add AuthLink, TenantAuthConfig, MagicLinkToken models to schema"
```

---

### Task 2: Domain Entities — AuthLink

**Files:**

- Create: `src/entities/core/auth-link.ts`

- [ ] **Step 1: Create AuthLink entity with value objects**

```typescript
import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type AuthLinkProvider =
  | 'EMAIL'
  | 'CPF'
  | 'ENROLLMENT'
  | 'GOOGLE'
  | 'MICROSOFT'
  | 'APPLE'
  | 'GITHUB';

export type AuthLinkStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthLinkProps {
  userId: UniqueEntityID;
  tenantId?: UniqueEntityID | null;
  provider: AuthLinkProvider;
  identifier: string;
  credential?: string | null;
  metadata?: Record<string, unknown> | null;
  status: AuthLinkStatus;
  linkedAt: Date;
  unlinkedAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

export class AuthLink extends Entity<AuthLinkProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get tenantId(): UniqueEntityID | null {
    return this.props.tenantId ?? null;
  }

  get provider(): AuthLinkProvider {
    return this.props.provider;
  }

  get identifier(): string {
    return this.props.identifier;
  }

  get credential(): string | null {
    return this.props.credential ?? null;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata ?? null;
  }

  get status(): AuthLinkStatus {
    return this.props.status;
  }

  set status(value: AuthLinkStatus) {
    this.props.status = value;
  }

  get linkedAt(): Date {
    return this.props.linkedAt;
  }

  get unlinkedAt(): Date | null {
    return this.props.unlinkedAt ?? null;
  }

  set unlinkedAt(value: Date | null) {
    this.props.unlinkedAt = value;
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt ?? null;
  }

  set lastUsedAt(value: Date | null) {
    this.props.lastUsedAt = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isActive(): boolean {
    return this.props.status === 'ACTIVE' && this.props.unlinkedAt === null;
  }

  get isLinked(): boolean {
    return this.props.unlinkedAt === null;
  }

  get hasCredential(): boolean {
    return (
      this.props.credential !== null && this.props.credential !== undefined
    );
  }

  get isGlobal(): boolean {
    return this.props.tenantId === null || this.props.tenantId === undefined;
  }

  deactivate(): void {
    this.props.status = 'INACTIVE';
  }

  activate(): void {
    this.props.status = 'ACTIVE';
  }

  unlink(): void {
    this.props.unlinkedAt = new Date();
    this.props.status = 'INACTIVE';
  }

  updateCredential(hashedCredential: string): void {
    this.props.credential = hashedCredential;
  }

  touchLastUsed(): void {
    this.props.lastUsedAt = new Date();
  }

  static create(props: AuthLinkProps, id?: UniqueEntityID): AuthLink {
    return new AuthLink(
      {
        ...props,
        tenantId: props.tenantId ?? null,
        credential: props.credential ?? null,
        metadata: props.metadata ?? null,
        status: props.status ?? 'ACTIVE',
        unlinkedAt: props.unlinkedAt ?? null,
        lastUsedAt: props.lastUsedAt ?? null,
      },
      id,
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/core/auth-link.ts
git commit -m "feat(auth): add AuthLink domain entity"
```

---

### Task 3: Domain Entities — TenantAuthConfig and MagicLinkToken

**Files:**

- Create: `src/entities/core/tenant-auth-config.ts`
- Create: `src/entities/core/magic-link-token.ts`

- [ ] **Step 1: Create TenantAuthConfig entity**

```typescript
import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { AuthLinkProvider } from './auth-link';

export interface TenantAuthConfigProps {
  tenantId: UniqueEntityID;
  allowedMethods: AuthLinkProvider[];
  magicLinkEnabled: boolean;
  magicLinkExpiresIn: number;
  defaultMethod?: AuthLinkProvider | null;
  createdAt: Date;
  updatedAt?: Date;
}

export class TenantAuthConfig extends Entity<TenantAuthConfigProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get allowedMethods(): AuthLinkProvider[] {
    return this.props.allowedMethods;
  }

  set allowedMethods(methods: AuthLinkProvider[]) {
    this.props.allowedMethods = methods;
  }

  get magicLinkEnabled(): boolean {
    return this.props.magicLinkEnabled;
  }

  set magicLinkEnabled(value: boolean) {
    this.props.magicLinkEnabled = value;
  }

  get magicLinkExpiresIn(): number {
    return this.props.magicLinkExpiresIn;
  }

  set magicLinkExpiresIn(value: number) {
    this.props.magicLinkExpiresIn = value;
  }

  get defaultMethod(): AuthLinkProvider | null {
    return this.props.defaultMethod ?? null;
  }

  set defaultMethod(value: AuthLinkProvider | null) {
    this.props.defaultMethod = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isMethodAllowed(provider: AuthLinkProvider): boolean {
    return this.props.allowedMethods.includes(provider);
  }

  static create(
    props: TenantAuthConfigProps,
    id?: UniqueEntityID,
  ): TenantAuthConfig {
    return new TenantAuthConfig(
      {
        ...props,
        allowedMethods: props.allowedMethods ?? ['EMAIL'],
        magicLinkEnabled: props.magicLinkEnabled ?? false,
        magicLinkExpiresIn: props.magicLinkExpiresIn ?? 15,
        defaultMethod: props.defaultMethod ?? null,
      },
      id,
    );
  }
}
```

- [ ] **Step 2: Create MagicLinkToken entity**

```typescript
import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface MagicLinkTokenProps {
  userId: UniqueEntityID;
  token: string;
  email: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export class MagicLinkToken extends Entity<MagicLinkTokenProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get email(): string {
    return this.props.email;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get usedAt(): Date | null {
    return this.props.usedAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get isUsed(): boolean {
    return this.props.usedAt !== null && this.props.usedAt !== undefined;
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isUsed;
  }

  markAsUsed(): void {
    this.props.usedAt = new Date();
  }

  static create(
    props: MagicLinkTokenProps,
    id?: UniqueEntityID,
  ): MagicLinkToken {
    return new MagicLinkToken(
      {
        ...props,
        usedAt: props.usedAt ?? null,
      },
      id,
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/core/tenant-auth-config.ts src/entities/core/magic-link-token.ts
git commit -m "feat(auth): add TenantAuthConfig and MagicLinkToken entities"
```

---

### Task 4: Repository Interfaces

**Files:**

- Create: `src/repositories/core/auth-links-repository.ts`
- Create: `src/repositories/core/tenant-auth-config-repository.ts`
- Create: `src/repositories/core/magic-link-tokens-repository.ts`

- [ ] **Step 1: Create AuthLinksRepository interface**

```typescript
import {
  AuthLink,
  AuthLinkProvider,
  AuthLinkStatus,
} from '@/entities/core/auth-link';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { TransactionClient } from '@/lib/transaction-manager';

export interface CreateAuthLinkSchema {
  userId: UniqueEntityID;
  tenantId?: UniqueEntityID | null;
  provider: AuthLinkProvider;
  identifier: string;
  credential?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: AuthLinkStatus;
}

export interface AuthLinksRepository {
  create(data: CreateAuthLinkSchema, tx?: TransactionClient): Promise<AuthLink>;
  findById(id: UniqueEntityID): Promise<AuthLink | null>;
  findByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null>;
  findActiveByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null>;
  findByUserId(userId: UniqueEntityID): Promise<AuthLink[]>;
  findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]>;
  findByUserIdAndProvider(
    userId: UniqueEntityID,
    provider: AuthLinkProvider,
  ): Promise<AuthLink | null>;
  countActiveByUserId(userId: UniqueEntityID): Promise<number>;
  updateStatus(
    id: UniqueEntityID,
    status: AuthLinkStatus,
  ): Promise<AuthLink | null>;
  updateCredentialByUserId(
    userId: UniqueEntityID,
    credential: string,
  ): Promise<number>;
  updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void>;
  softDelete(id: UniqueEntityID): Promise<AuthLink | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
```

- [ ] **Step 2: Create TenantAuthConfigRepository interface**

```typescript
import { TenantAuthConfig } from '@/entities/core/tenant-auth-config';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { AuthLinkProvider } from '@/entities/core/auth-link';

export interface CreateTenantAuthConfigSchema {
  tenantId: UniqueEntityID;
  allowedMethods?: AuthLinkProvider[];
  magicLinkEnabled?: boolean;
  magicLinkExpiresIn?: number;
  defaultMethod?: AuthLinkProvider | null;
}

export interface UpdateTenantAuthConfigSchema {
  id: UniqueEntityID;
  allowedMethods?: AuthLinkProvider[];
  magicLinkEnabled?: boolean;
  magicLinkExpiresIn?: number;
  defaultMethod?: AuthLinkProvider | null;
}

export interface TenantAuthConfigRepository {
  create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;
  findByTenantId(tenantId: UniqueEntityID): Promise<TenantAuthConfig | null>;
  update(data: UpdateTenantAuthConfigSchema): Promise<TenantAuthConfig | null>;
  upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;
}
```

- [ ] **Step 3: Create MagicLinkTokensRepository interface**

```typescript
import { MagicLinkToken } from '@/entities/core/magic-link-token';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface CreateMagicLinkTokenSchema {
  userId: UniqueEntityID;
  token: string;
  email: string;
  expiresAt: Date;
}

export interface MagicLinkTokensRepository {
  create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken>;
  findByToken(tokenHash: string): Promise<MagicLinkToken | null>;
  markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null>;
  deleteExpired(): Promise<number>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/repositories/core/auth-links-repository.ts src/repositories/core/tenant-auth-config-repository.ts src/repositories/core/magic-link-tokens-repository.ts
git commit -m "feat(auth): add repository interfaces for AuthLink, TenantAuthConfig, MagicLinkToken"
```

---

### Task 5: In-Memory Repositories (for unit tests)

**Files:**

- Create: `src/repositories/core/in-memory/in-memory-auth-links-repository.ts`
- Create: `src/repositories/core/in-memory/in-memory-tenant-auth-config-repository.ts`
- Create: `src/repositories/core/in-memory/in-memory-magic-link-tokens-repository.ts`

- [ ] **Step 1: Create InMemoryAuthLinksRepository**

```typescript
import {
  AuthLink,
  AuthLinkProvider,
  AuthLinkStatus,
} from '@/entities/core/auth-link';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  AuthLinksRepository,
  CreateAuthLinkSchema,
} from '../auth-links-repository';

export class InMemoryAuthLinksRepository implements AuthLinksRepository {
  private items: AuthLink[] = [];

  async create(data: CreateAuthLinkSchema): Promise<AuthLink> {
    const authLink = AuthLink.create(
      {
        userId: data.userId,
        tenantId: data.tenantId ?? null,
        provider: data.provider,
        identifier: data.identifier,
        credential: data.credential ?? null,
        metadata: data.metadata ?? null,
        status: data.status ?? 'ACTIVE',
        linkedAt: new Date(),
        createdAt: new Date(),
      },
      new UniqueEntityID(),
    );
    this.items.push(authLink);
    return authLink;
  }

  async findById(id: UniqueEntityID): Promise<AuthLink | null> {
    return (
      this.items.find((item) => item.id.equals(id) && item.isLinked) ?? null
    );
  }

  async findByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    return (
      this.items.find(
        (item) =>
          item.provider === provider &&
          item.identifier === identifier &&
          item.isLinked,
      ) ?? null
    );
  }

  async findActiveByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    return (
      this.items.find(
        (item) =>
          item.provider === provider &&
          item.identifier === identifier &&
          item.isActive,
      ) ?? null
    );
  }

  async findByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.isLinked,
    );
  }

  async findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.isActive,
    );
  }

  async findByUserIdAndProvider(
    userId: UniqueEntityID,
    provider: AuthLinkProvider,
  ): Promise<AuthLink | null> {
    return (
      this.items.find(
        (item) =>
          item.userId.equals(userId) &&
          item.provider === provider &&
          item.isLinked,
      ) ?? null
    );
  }

  async countActiveByUserId(userId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.isActive,
    ).length;
  }

  async updateStatus(
    id: UniqueEntityID,
    status: AuthLinkStatus,
  ): Promise<AuthLink | null> {
    const authLink = this.items.find((item) => item.id.equals(id));
    if (!authLink) return null;
    authLink.status = status;
    return authLink;
  }

  async updateCredentialByUserId(
    userId: UniqueEntityID,
    credential: string,
  ): Promise<number> {
    const links = this.items.filter(
      (item) =>
        item.userId.equals(userId) && item.hasCredential && item.isLinked,
    );
    links.forEach((link) => link.updateCredential(credential));
    return links.length;
  }

  async updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void> {
    const authLink = this.items.find((item) => item.id.equals(id));
    if (authLink) authLink.lastUsedAt = date;
  }

  async softDelete(id: UniqueEntityID): Promise<AuthLink | null> {
    const authLink = this.items.find((item) => item.id.equals(id));
    if (!authLink) return null;
    authLink.unlink();
    return authLink;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }
}
```

- [ ] **Step 2: Create InMemoryTenantAuthConfigRepository**

```typescript
import { TenantAuthConfig } from '@/entities/core/tenant-auth-config';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  TenantAuthConfigRepository,
  CreateTenantAuthConfigSchema,
  UpdateTenantAuthConfigSchema,
} from '../tenant-auth-config-repository';

export class InMemoryTenantAuthConfigRepository
  implements TenantAuthConfigRepository
{
  private items: TenantAuthConfig[] = [];

  async create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig> {
    const config = TenantAuthConfig.create(
      {
        tenantId: data.tenantId,
        allowedMethods: data.allowedMethods ?? ['EMAIL'],
        magicLinkEnabled: data.magicLinkEnabled ?? false,
        magicLinkExpiresIn: data.magicLinkExpiresIn ?? 15,
        defaultMethod: data.defaultMethod ?? null,
        createdAt: new Date(),
      },
      new UniqueEntityID(),
    );
    this.items.push(config);
    return config;
  }

  async findByTenantId(
    tenantId: UniqueEntityID,
  ): Promise<TenantAuthConfig | null> {
    return this.items.find((item) => item.tenantId.equals(tenantId)) ?? null;
  }

  async update(
    data: UpdateTenantAuthConfigSchema,
  ): Promise<TenantAuthConfig | null> {
    const config = this.items.find((item) => item.id.equals(data.id));
    if (!config) return null;
    if (data.allowedMethods !== undefined)
      config.allowedMethods = data.allowedMethods;
    if (data.magicLinkEnabled !== undefined)
      config.magicLinkEnabled = data.magicLinkEnabled;
    if (data.magicLinkExpiresIn !== undefined)
      config.magicLinkExpiresIn = data.magicLinkExpiresIn;
    if (data.defaultMethod !== undefined)
      config.defaultMethod = data.defaultMethod;
    return config;
  }

  async upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig> {
    const existing = await this.findByTenantId(data.tenantId);
    if (existing) {
      return (await this.update({
        id: existing.id,
        allowedMethods: data.allowedMethods,
        magicLinkEnabled: data.magicLinkEnabled,
        magicLinkExpiresIn: data.magicLinkExpiresIn,
        defaultMethod: data.defaultMethod,
      }))!;
    }
    return this.create(data);
  }
}
```

- [ ] **Step 3: Create InMemoryMagicLinkTokensRepository**

```typescript
import { MagicLinkToken } from '@/entities/core/magic-link-token';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  MagicLinkTokensRepository,
  CreateMagicLinkTokenSchema,
} from '../magic-link-tokens-repository';

export class InMemoryMagicLinkTokensRepository
  implements MagicLinkTokensRepository
{
  private items: MagicLinkToken[] = [];

  async create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken> {
    const token = MagicLinkToken.create(
      {
        userId: data.userId,
        token: data.token,
        email: data.email,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      },
      new UniqueEntityID(),
    );
    this.items.push(token);
    return token;
  }

  async findByToken(tokenHash: string): Promise<MagicLinkToken | null> {
    return this.items.find((item) => item.token === tokenHash) ?? null;
  }

  async markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null> {
    const token = this.items.find((item) => item.id.equals(id));
    if (!token) return null;
    token.markAsUsed();
    return token;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const before = this.items.length;
    this.items = this.items.filter((item) => !item.isExpired || item.isUsed);
    return before - this.items.length;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/repositories/core/in-memory/
git commit -m "feat(auth): add in-memory repositories for auth link system"
```

---

### Task 6: Prisma Repositories

**Files:**

- Create: `src/repositories/core/prisma/prisma-auth-links-repository.ts`
- Create: `src/repositories/core/prisma/prisma-tenant-auth-config-repository.ts`
- Create: `src/repositories/core/prisma/prisma-magic-link-tokens-repository.ts`

- [ ] **Step 1: Create PrismaAuthLinksRepository**

```typescript
import { prisma } from '@/lib/prisma';
import {
  AuthLink,
  AuthLinkProvider,
  AuthLinkStatus,
} from '@/entities/core/auth-link';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  AuthLinksRepository,
  CreateAuthLinkSchema,
} from '../auth-links-repository';
import { TransactionClient } from '@/lib/transaction-manager';

function mapToDomain(raw: any): AuthLink {
  return AuthLink.create(
    {
      userId: new UniqueEntityID(raw.userId),
      tenantId: raw.tenantId ? new UniqueEntityID(raw.tenantId) : null,
      provider: raw.provider as AuthLinkProvider,
      identifier: raw.identifier,
      credential: raw.credential,
      metadata: raw.metadata as Record<string, unknown> | null,
      status: raw.status as AuthLinkStatus,
      linkedAt: raw.linkedAt,
      unlinkedAt: raw.unlinkedAt,
      lastUsedAt: raw.lastUsedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaAuthLinksRepository implements AuthLinksRepository {
  async create(
    data: CreateAuthLinkSchema,
    tx?: TransactionClient,
  ): Promise<AuthLink> {
    const client = tx ?? prisma;
    const raw = await client.authLink.create({
      data: {
        userId: data.userId.toString(),
        tenantId: data.tenantId?.toString() ?? null,
        provider: data.provider,
        identifier: data.identifier,
        credential: data.credential ?? null,
        metadata: data.metadata ?? undefined,
        status: data.status ?? 'ACTIVE',
      },
    });
    return mapToDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: { id: id.toString(), unlinkedAt: null },
    });
    return raw ? mapToDomain(raw) : null;
  }

  async findByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: { provider, identifier, unlinkedAt: null },
    });
    return raw ? mapToDomain(raw) : null;
  }

  async findActiveByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: { provider, identifier, status: 'ACTIVE', unlinkedAt: null },
    });
    return raw ? mapToDomain(raw) : null;
  }

  async findByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    const raws = await prisma.authLink.findMany({
      where: { userId: userId.toString(), unlinkedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return raws.map(mapToDomain);
  }

  async findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    const raws = await prisma.authLink.findMany({
      where: { userId: userId.toString(), status: 'ACTIVE', unlinkedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return raws.map(mapToDomain);
  }

  async findByUserIdAndProvider(
    userId: UniqueEntityID,
    provider: AuthLinkProvider,
  ): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: { userId: userId.toString(), provider, unlinkedAt: null },
    });
    return raw ? mapToDomain(raw) : null;
  }

  async countActiveByUserId(userId: UniqueEntityID): Promise<number> {
    return prisma.authLink.count({
      where: { userId: userId.toString(), status: 'ACTIVE', unlinkedAt: null },
    });
  }

  async updateStatus(
    id: UniqueEntityID,
    status: AuthLinkStatus,
  ): Promise<AuthLink | null> {
    try {
      const raw = await prisma.authLink.update({
        where: { id: id.toString() },
        data: { status },
      });
      return mapToDomain(raw);
    } catch {
      return null;
    }
  }

  async updateCredentialByUserId(
    userId: UniqueEntityID,
    credential: string,
  ): Promise<number> {
    const result = await prisma.authLink.updateMany({
      where: {
        userId: userId.toString(),
        credential: { not: null },
        unlinkedAt: null,
      },
      data: { credential },
    });
    return result.count;
  }

  async updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void> {
    await prisma.authLink.update({
      where: { id: id.toString() },
      data: { lastUsedAt: date },
    });
  }

  async softDelete(id: UniqueEntityID): Promise<AuthLink | null> {
    try {
      const raw = await prisma.authLink.update({
        where: { id: id.toString() },
        data: { unlinkedAt: new Date(), status: 'INACTIVE' },
      });
      return mapToDomain(raw);
    } catch {
      return null;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.authLink.delete({ where: { id: id.toString() } });
  }
}
```

- [ ] **Step 2: Create PrismaTenantAuthConfigRepository**

Follow same pattern: create, findByTenantId, update, upsert — mapping Prisma rows to TenantAuthConfig entity. Use `prisma.tenantAuthConfig` client. The `upsert` method should use `prisma.tenantAuthConfig.upsert()` with `where: { tenantId }`.

- [ ] **Step 3: Create PrismaMagicLinkTokensRepository**

Follow same pattern: create, findByToken (by hash), markAsUsed (update usedAt), deleteExpired (delete where expiresAt < now AND usedAt is null). Map rows to MagicLinkToken entity.

- [ ] **Step 4: Commit**

```bash
git add src/repositories/core/prisma/
git commit -m "feat(auth): add Prisma repositories for auth link system"
```

---

### Task 7: Mappers — AuthLink DTO

**Files:**

- Create: `src/mappers/core/auth-link/auth-link-to-dto.ts`

- [ ] **Step 1: Create AuthLink mapper and DTO**

```typescript
import { AuthLink } from '@/entities/core/auth-link';

export interface AuthLinkDTO {
  id: string;
  userId: string;
  tenantId: string | null;
  provider: string;
  identifier: string;
  hasCredential: boolean;
  metadata: Record<string, unknown> | null;
  status: string;
  linkedAt: string;
  unlinkedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export function authLinkToDTO(authLink: AuthLink): AuthLinkDTO {
  return {
    id: authLink.id.toString(),
    userId: authLink.userId.toString(),
    tenantId: authLink.tenantId?.toString() ?? null,
    provider: authLink.provider,
    identifier: maskIdentifier(authLink.provider, authLink.identifier),
    hasCredential: authLink.hasCredential,
    metadata: sanitizeMetadata(authLink.metadata),
    status: authLink.status,
    linkedAt: authLink.linkedAt.toISOString(),
    unlinkedAt: authLink.unlinkedAt?.toISOString() ?? null,
    lastUsedAt: authLink.lastUsedAt?.toISOString() ?? null,
    createdAt: authLink.createdAt.toISOString(),
  };
}

function maskIdentifier(provider: string, identifier: string): string {
  switch (provider) {
    case 'CPF':
      return `***.***.${identifier.slice(6, 9)}-${identifier.slice(9)}`;
    case 'EMAIL':
      const [local, domain] = identifier.split('@');
      return `${local.slice(0, 2)}***@${domain}`;
    default:
      return identifier;
  }
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const { refreshToken, accessToken, ...safe } = metadata;
  return safe;
}
```

- [ ] **Step 2: Create TenantAuthConfig DTO mapper**

```typescript
import { TenantAuthConfig } from '@/entities/core/tenant-auth-config';

export interface TenantAuthConfigDTO {
  id: string;
  tenantId: string;
  allowedMethods: string[];
  magicLinkEnabled: boolean;
  magicLinkExpiresIn: number;
  defaultMethod: string | null;
}

export function tenantAuthConfigToDTO(
  config: TenantAuthConfig,
): TenantAuthConfigDTO {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId.toString(),
    allowedMethods: config.allowedMethods,
    magicLinkEnabled: config.magicLinkEnabled,
    magicLinkExpiresIn: config.magicLinkExpiresIn,
    defaultMethod: config.defaultMethod,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/mappers/core/auth-link/
git commit -m "feat(auth): add AuthLink and TenantAuthConfig DTO mappers"
```

---

### Task 8: Permission Codes + LoginMethod Update

**Files:**

- Modify: `src/constants/rbac/permission-codes.ts`
- Modify: `src/entities/core/session.ts`

- [ ] **Step 1: Add admin.settings permissions**

In `permission-codes.ts`, add inside the `ADMIN` block after `AUDIT`:

```typescript
SETTINGS: {
  ACCESS: 'admin.settings.access' as const,
  ADMIN: 'admin.settings.admin' as const,
},
```

Also add the corresponding entries to the `ALL_PERMISSION_CODES` array and the `PERMISSION_LABELS` map (labels: "Acessar Configurações", "Administrar Configurações").

- [ ] **Step 2: Update LoginMethod type in Session entity**

In `src/entities/core/session.ts`, update the LoginMethod type:

```typescript
export type LoginMethod =
  | 'password'
  | 'email'
  | 'cpf'
  | 'enrollment'
  | 'oauth'
  | 'magic_link'
  | 'access_pin'
  | 'api_key';
```

Keep `'password'` for backward compatibility with existing sessions.

- [ ] **Step 3: Commit**

```bash
git add src/constants/rbac/permission-codes.ts src/entities/core/session.ts
git commit -m "feat(auth): add admin.settings permissions and expand LoginMethod type"
```

---

## Phase 2: Core Use Cases — Unified Login + Magic Link

### Task 9: Identifier Detection Utility

**Files:**

- Create: `src/use-cases/core/auth/utils/detect-identifier-type.ts`
- Create: `src/use-cases/core/auth/utils/detect-identifier-type.spec.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { detectIdentifierType } from './detect-identifier-type';

describe('detectIdentifierType', () => {
  it('should detect email by @ symbol', () => {
    expect(detectIdentifierType('user@example.com')).toBe('EMAIL');
    expect(detectIdentifierType('admin@teste.com')).toBe('EMAIL');
  });

  it('should detect CPF by 11 numeric digits', () => {
    expect(detectIdentifierType('12345678901')).toBe('CPF');
    expect(detectIdentifierType('123.456.789-01')).toBe('CPF');
  });

  it('should detect enrollment for other patterns', () => {
    expect(detectIdentifierType('EMP001')).toBe('ENROLLMENT');
    expect(detectIdentifierType('RH-0042')).toBe('ENROLLMENT');
    expect(detectIdentifierType('12345')).toBe('ENROLLMENT');
  });

  it('should trim whitespace before detection', () => {
    expect(detectIdentifierType(' user@example.com ')).toBe('EMAIL');
    expect(detectIdentifierType(' 12345678901 ')).toBe('CPF');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/use-cases/core/auth/utils/detect-identifier-type.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```typescript
import { AuthLinkProvider } from '@/entities/core/auth-link';

export function detectIdentifierType(input: string): AuthLinkProvider {
  const trimmed = input.trim();

  if (trimmed.includes('@')) {
    return 'EMAIL';
  }

  const digitsOnly = trimmed.replace(/[\.\-\/]/g, '');
  if (/^\d{11}$/.test(digitsOnly)) {
    return 'CPF';
  }

  return 'ENROLLMENT';
}

export function normalizeIdentifier(
  provider: AuthLinkProvider,
  input: string,
): string {
  const trimmed = input.trim();

  switch (provider) {
    case 'EMAIL':
      return trimmed.toLowerCase();
    case 'CPF':
      return trimmed.replace(/[\.\-\/]/g, '');
    default:
      return trimmed;
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run src/use-cases/core/auth/utils/detect-identifier-type.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/use-cases/core/auth/utils/
git commit -m "feat(auth): add identifier type detection and normalization utilities"
```

---

### Task 10: Unified Login Use Case

**Files:**

- Create: `src/use-cases/core/auth/authenticate-unified.ts`
- Create: `src/use-cases/core/auth/authenticate-unified.spec.ts`
- Create: `src/use-cases/core/auth/factories/make-authenticate-unified-use-case.ts`

- [ ] **Step 1: Write unit tests**

Test cases:

1. Should authenticate with email + password
2. Should authenticate with CPF + password
3. Should authenticate with enrollment + password
4. Should reject inactive auth link with specific error
5. Should reject wrong password and increment failed attempts
6. Should reject non-existent identifier with generic error
7. Should block after MAX_ATTEMPTS failed logins
8. Should update lastUsedAt on successful login
9. Should respect forcePasswordReset on User
10. Should handle enrollment scoped to specific tenant

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/use-cases/core/auth/authenticate-unified.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement AuthenticateUnifiedUseCase**

Constructor dependencies:

- `authLinksRepository: AuthLinksRepository`
- `usersRepository: UsersRepository`
- `createSessionUseCase: CreateSessionUseCase`

Request: `{ identifier: string; password: string; ip: string; userAgent?: string; reply: FastifyReply }`

Flow:

1. `detectIdentifierType(identifier)` → provider
2. `normalizeIdentifier(provider, identifier)` → normalized
3. `authLinksRepository.findByProviderAndIdentifier(provider, normalized)` → authLink
4. If not found → throw BadRequestError (generic message)
5. If authLink.status === 'INACTIVE' → throw ForbiddenError("Método de login desabilitado...")
6. Find User: `usersRepository.findById(authLink.userId)`
7. Check lockout (User.blockedUntil)
8. If no credential on authLink → throw BadRequestError (no password login for this method)
9. `Password.compare(password, authLink.credential)` → if fails, increment failedLoginAttempts
10. Reset failedLoginAttempts on success
11. Check forcePasswordReset
12. Update authLink.lastUsedAt
13. Update User.lastLoginAt
14. Create session with `loginMethod: provider.toLowerCase()`
15. Return `{ user: UserDTO, sessionId, token, refreshToken }`

- [ ] **Step 4: Create factory**

```typescript
export function makeAuthenticateUnifiedUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();
  const usersRepository = new PrismaUsersRepository();
  const createSessionUseCase = makeCreateSessionUseCase();
  return new AuthenticateUnifiedUseCase(
    authLinksRepository,
    usersRepository,
    createSessionUseCase,
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run src/use-cases/core/auth/authenticate-unified.spec.ts`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/use-cases/core/auth/authenticate-unified.ts src/use-cases/core/auth/authenticate-unified.spec.ts src/use-cases/core/auth/factories/make-authenticate-unified-use-case.ts
git commit -m "feat(auth): implement unified login use case (email/CPF/matrícula)"
```

---

### Task 11: Magic Link Request Use Case

**Files:**

- Create: `src/use-cases/core/auth/request-magic-link.ts`
- Create: `src/use-cases/core/auth/request-magic-link.spec.ts`
- Create: `src/use-cases/core/auth/factories/make-request-magic-link-use-case.ts`

- [ ] **Step 1: Write unit tests**

Test cases:

1. Should send magic link email for valid email identifier
2. Should send magic link email when CPF has email AuthLink
3. Should throw if user has no email AuthLink
4. Should throw if magic link not enabled for any user tenant
5. Should not reveal whether identifier exists (always return success message)
6. Should hash token before storing

- [ ] **Step 2: Implement**

Constructor dependencies:

- `authLinksRepository: AuthLinksRepository`
- `usersRepository: UsersRepository`
- `magicLinkTokensRepository: MagicLinkTokensRepository`
- `tenantAuthConfigRepository: TenantAuthConfigRepository`
- `emailService: EmailService`

Request: `{ identifier: string }`

Flow:

1. Detect and normalize identifier
2. Find authLink → if not found, return generic success (don't reveal)
3. Find user by authLink.userId
4. Find user's email (from EMAIL authLink or User.email)
5. If no email → return generic success (don't reveal)
6. Check if any of user's tenants have magicLinkEnabled
7. If none → throw ForbiddenError
8. Generate token: `crypto.randomBytes(32).toString('base64url')`
9. Hash: `crypto.createHash('sha256').update(rawToken).digest('hex')`
10. Store MagicLinkToken with hashed token
11. Send email with raw token in URL
12. Return `{ message: "Se o identificador estiver cadastrado, um email foi enviado." }`

- [ ] **Step 3: Create factory**

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/use-cases/core/auth/request-magic-link.ts src/use-cases/core/auth/request-magic-link.spec.ts src/use-cases/core/auth/factories/make-request-magic-link-use-case.ts
git commit -m "feat(auth): implement magic link request use case"
```

---

### Task 12: Magic Link Verify Use Case

**Files:**

- Create: `src/use-cases/core/auth/verify-magic-link.ts`
- Create: `src/use-cases/core/auth/verify-magic-link.spec.ts`
- Create: `src/use-cases/core/auth/factories/make-verify-magic-link-use-case.ts`

- [ ] **Step 1: Write unit tests**

Test cases:

1. Should authenticate with valid magic link token
2. Should reject expired token
3. Should reject already-used token
4. Should reject invalid token
5. Should mark token as used after successful auth
6. Should create session with loginMethod 'magic_link'

- [ ] **Step 2: Implement**

Request: `{ token: string; ip: string; userAgent?: string; reply: FastifyReply }`

Flow:

1. Hash incoming raw token with SHA-256
2. `magicLinkTokensRepository.findByToken(hash)`
3. Validate: not null, not expired, not used
4. Mark as used
5. Find user
6. Create session (loginMethod: 'magic_link')
7. Return JWT

- [ ] **Step 3: Create factory, run tests, commit**

```bash
git commit -m "feat(auth): implement magic link verification use case"
```

---

### Task 13: Auth Link Management Use Cases

**Files:**

- Create: `src/use-cases/core/auth/list-auth-links.ts`
- Create: `src/use-cases/core/auth/link-auth-method.ts`
- Create: `src/use-cases/core/auth/toggle-auth-link-status.ts`
- Create: `src/use-cases/core/auth/unlink-auth-method.ts`
- Create: `src/use-cases/core/auth/link-auth-method.spec.ts`
- Create: `src/use-cases/core/auth/unlink-auth-method.spec.ts`
- Create factories for each

- [ ] **Step 1: Implement ListAuthLinksUseCase**

Simple: takes `userId`, returns `AuthLinkDTO[]` from repository.

- [ ] **Step 2: Implement LinkAuthMethodUseCase with tests**

Request: `{ userId, provider, identifier, password (current, for verification), tenantId? }`

Flow:

1. Verify user exists
2. Verify password (user must confirm identity)
3. Normalize identifier
4. Check if identifier already linked to another user → 409 conflict
5. Check if user already has this provider → error
6. Create AuthLink with credential = User's current password_hash (for EMAIL/CPF/ENROLLMENT) or null (for OAuth)
7. Return new AuthLinkDTO

Test cases:

1. Should link CPF to user
2. Should reject if CPF already linked to another user
3. Should reject if wrong password
4. Should reject if user already has that provider

- [ ] **Step 3: Implement ToggleAuthLinkStatusUseCase**

Request: `{ authLinkId, userId, newStatus, isAdmin? }`

Flow:

1. Find authLink by ID
2. Verify ownership (userId matches, or isAdmin=true)
3. If deactivating: check countActiveByUserId > 1 (unless isAdmin override)
4. Update status

- [ ] **Step 4: Implement UnlinkAuthMethodUseCase with tests**

Request: `{ authLinkId, userId, isAdmin? }`

Flow:

1. Find authLink by ID
2. Verify ownership (or isAdmin)
3. If not admin: check countActiveByUserId > 1
4. Soft delete (set unlinkedAt)
5. Return unlinked AuthLinkDTO

Test cases:

1. Should unlink auth method
2. Should reject unlinking last active method (non-admin)
3. Should allow admin to unlink last method (override)

- [ ] **Step 5: Create factories for all four use cases**

- [ ] **Step 6: Run all tests, commit**

```bash
git commit -m "feat(auth): implement auth link management use cases (list, link, toggle, unlink)"
```

---

### Task 14: Tenant Auth Config Use Cases

**Files:**

- Create: `src/use-cases/core/auth/get-tenant-auth-config.ts`
- Create: `src/use-cases/core/auth/update-tenant-auth-config.ts`
- Create: `src/use-cases/core/auth/get-available-auth-methods.ts`
- Create factories for each

- [ ] **Step 1: Implement GetTenantAuthConfigUseCase**

Takes `tenantId`, returns TenantAuthConfigDTO. If not found, returns default config.

- [ ] **Step 2: Implement UpdateTenantAuthConfigUseCase**

Request: `{ tenantId, allowedMethods?, magicLinkEnabled?, magicLinkExpiresIn?, defaultMethod? }`

Flow:

1. Upsert config
2. If a method was removed from allowedMethods: batch-update all AuthLinks of that provider for this tenant's users to INACTIVE
3. Return updated config

- [ ] **Step 3: Implement GetAvailableAuthMethodsUseCase**

Public endpoint. Takes `tenantSlug?`. Returns available methods for display on login page. If no slug, returns defaults.

- [ ] **Step 4: Create factories, commit**

```bash
git commit -m "feat(auth): implement tenant auth config use cases"
```

---

### Task 15: Credential Sync — Update Existing Password Flows

**Files:**

- Modify: `src/use-cases/core/me/change-my-password.ts`
- Modify: `src/use-cases/core/auth/reset-password-by-token.ts`
- Modify: `src/use-cases/core/users/change-user-password.ts` (if exists)

- [ ] **Step 1: Inject AuthLinksRepository into ChangeMyPasswordUseCase**

Add `authLinksRepository` as constructor dependency. After password hash update on User, call:

```typescript
await this.authLinksRepository.updateCredentialByUserId(
  user.id,
  newPasswordHash.toString(),
);
```

- [ ] **Step 2: Same for ResetPasswordByToken and ChangeUserPassword (admin)**

- [ ] **Step 3: Update factories to inject PrismaAuthLinksRepository**

- [ ] **Step 4: Update unit tests to inject InMemoryAuthLinksRepository and verify credential sync**

- [ ] **Step 5: Run tests, commit**

```bash
git commit -m "feat(auth): sync credentials across AuthLinks on password change"
```

---

## Phase 3: Controllers — HTTP Layer

### Task 16: Unified Login Controller

**Files:**

- Create: `src/http/controllers/core/auth/v1-authenticate-unified.controller.ts`

- [ ] **Step 1: Implement controller**

Route: `POST /v1/auth/login/unified`
Schema:

```typescript
const unifiedLoginSchema = z.object({
  identifier: z.string().min(1, 'Identificador obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});
```

Follow exact pattern from `v1-authenticate-with-password.controller.ts`:

- Rate limiting (uses auth rate limit from routes)
- Brute-force guard
- Auto-tenant selection for single-tenant users
- Calendar initialization
- Audit logging (`AUDIT_MESSAGES.CORE.AUTH_LOGIN`)
- Error handling (BadRequestError, PasswordResetRequiredError, UserBlockedError, ForbiddenError)

- [ ] **Step 2: Register in auth routes**

In `src/http/controllers/core/auth/routes.ts`, add `authenticateUnifiedController` to the public auth routes block.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): add unified login controller (POST /v1/auth/login/unified)"
```

---

### Task 17: Magic Link Controllers

**Files:**

- Create: `src/http/controllers/core/auth/v1-request-magic-link.controller.ts`
- Create: `src/http/controllers/core/auth/v1-verify-magic-link.controller.ts`

- [ ] **Step 1: Implement request controller**

Route: `POST /v1/auth/magic-link/request`
Schema: `{ identifier: z.string().min(1) }`
Always returns 200 with generic message (security).

- [ ] **Step 2: Implement verify controller**

Route: `POST /v1/auth/magic-link/verify`
Schema: `{ token: z.string().min(1) }`
Returns JWT on success (same format as login response).

- [ ] **Step 3: Register in routes, commit**

```bash
git commit -m "feat(auth): add magic link request and verify controllers"
```

---

### Task 18: Auth Methods Public Controller

**Files:**

- Create: `src/http/controllers/core/auth/v1-get-auth-methods.controller.ts`

- [ ] **Step 1: Implement**

Route: `GET /v1/auth/methods`
Query: `{ tenantSlug?: string }`
Returns: `{ methods: string[], magicLinkEnabled: boolean, defaultMethod: string | null }`
Public endpoint (no auth required).

- [ ] **Step 2: Register in routes, commit**

```bash
git commit -m "feat(auth): add public auth methods endpoint"
```

---

### Task 19: Self-Service Auth Link Controllers (Profile)

**Files:**

- Create: `src/http/controllers/core/me/v1-list-my-auth-links.controller.ts`
- Create: `src/http/controllers/core/me/v1-link-auth-method.controller.ts`
- Create: `src/http/controllers/core/me/v1-toggle-my-auth-link.controller.ts`
- Create: `src/http/controllers/core/me/v1-unlink-my-auth-method.controller.ts`

- [ ] **Step 1: Implement list controller**

Route: `GET /v1/users/me/auth-links`
Auth: `[verifyJwt]`
Returns: `{ authLinks: AuthLinkDTO[] }`

- [ ] **Step 2: Implement link controller**

Route: `POST /v1/users/me/auth-links`
Auth: `[verifyJwt]`
Schema: `{ provider: enum, identifier: string, currentPassword: string }`

- [ ] **Step 3: Implement toggle controller**

Route: `PATCH /v1/users/me/auth-links/:id`
Auth: `[verifyJwt]`
Schema: `{ status: 'ACTIVE' | 'INACTIVE' }`

- [ ] **Step 4: Implement unlink controller**

Route: `DELETE /v1/users/me/auth-links/:id`
Auth: `[verifyJwt]`

- [ ] **Step 5: Register all in me routes, commit**

```bash
git commit -m "feat(auth): add self-service auth link management controllers"
```

---

### Task 20: Admin Auth Link Controllers

**Files:**

- Create: `src/http/controllers/core/users/v1-list-user-auth-links.controller.ts`
- Create: `src/http/controllers/core/users/v1-admin-link-auth-method.controller.ts`
- Create: `src/http/controllers/core/users/v1-admin-toggle-auth-link.controller.ts`
- Create: `src/http/controllers/core/users/v1-admin-unlink-auth-method.controller.ts`

- [ ] **Step 1: Implement all four admin controllers**

Same as self-service but:

- Uses `verifyPermission('admin.users.access')` for list
- Uses `verifyPermission('admin.users.modify')` for link/toggle
- Uses `verifyPermission('admin.users.admin')` for unlink (override allowed)
- Gets userId from URL params, not JWT
- Logs all actions to Audit

- [ ] **Step 2: Register in users routes, commit**

```bash
git commit -m "feat(auth): add admin auth link management controllers"
```

---

### Task 21: Tenant Auth Config Controllers

**Files:**

- Create: `src/http/controllers/core/auth/v1-get-tenant-auth-config.controller.ts`
- Create: `src/http/controllers/core/auth/v1-update-tenant-auth-config.controller.ts`

- [ ] **Step 1: Implement GET controller**

Route: `GET /v1/tenant-auth-config`
Auth: `[verifyJwt, verifyTenant, verifyPermission('admin.settings.access')]`

- [ ] **Step 2: Implement PUT controller**

Route: `PUT /v1/tenant-auth-config`
Auth: `[verifyJwt, verifyTenant, verifyPermission('admin.settings.admin')]`
Schema: `{ allowedMethods: string[], magicLinkEnabled: boolean, magicLinkExpiresIn: number, defaultMethod?: string }`

- [ ] **Step 3: Register in routes, commit**

```bash
git commit -m "feat(auth): add tenant auth config management controllers"
```

---

## Phase 4: Integration Updates

### Task 22: Update User Creation to Create AuthLink

**Files:**

- Modify: `src/use-cases/core/users/create-user.ts`
- Modify: `src/use-cases/core/auth/register-new-user.ts`

- [ ] **Step 1: Inject AuthLinksRepository into both use cases**

After creating User, also create AuthLink(provider=EMAIL):

```typescript
await this.authLinksRepository.create(
  {
    userId: user.id,
    provider: 'EMAIL',
    identifier: email.value.toLowerCase(),
    credential: passwordHash.toString(),
  },
  tx,
);
```

- [ ] **Step 2: Update factories, update tests**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): create EMAIL AuthLink on user registration"
```

---

### Task 23: Update Employee Creation to Create AuthLinks

**Files:**

- Modify: `src/http/controllers/hr/employees/v1-create-employee-with-user.controller.ts` (or its use case)

- [ ] **Step 1: After creating user + EMAIL AuthLink, check tenant config**

```typescript
const tenantConfig = await tenantAuthConfigRepository.findByTenantId(tenantId);

if (employee.cpf && tenantConfig?.isMethodAllowed('CPF')) {
  await authLinksRepository.create(
    {
      userId: user.id,
      provider: 'CPF',
      identifier: employee.cpf.replace(/[\.\-]/g, ''),
      credential: passwordHash.toString(),
    },
    tx,
  );
}

if (
  employee.registrationNumber &&
  tenantConfig?.isMethodAllowed('ENROLLMENT')
) {
  await authLinksRepository.create(
    {
      userId: user.id,
      tenantId,
      provider: 'ENROLLMENT',
      identifier: employee.registrationNumber,
      credential: passwordHash.toString(),
    },
    tx,
  );
}
```

- [ ] **Step 2: Update factory, commit**

```bash
git commit -m "feat(auth): create CPF/Matrícula AuthLinks on employee creation with user"
```

---

### Task 24: Email Service — Add Magic Link Email

**Files:**

- Modify: `src/services/email-service.ts`

- [ ] **Step 1: Add sendMagicLinkEmail method**

```typescript
async sendMagicLinkEmail(email: string, token: string, expiresInMinutes: number): Promise<EmailServiceResponse> {
  const magicLinkUrl = `${env.FRONTEND_URL}/auth/magic-link?token=${token}`;

  if (env.NODE_ENV === 'test') {
    return { success: true, message: 'Magic link email simulated.', return: { magicLinkUrl } };
  }

  try {
    const sentInformation = await this.transporter.sendMail({
      from: `"OpenSea" <${env.SMTP_USER}>`,
      to: email,
      subject: 'Seu link de acesso',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Acesso rápido</h2>
          <p>Clique no botão abaixo para acessar sua conta. Este link expira em ${expiresInMinutes} minutos.</p>
          <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background: #6d28d9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Entrar
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #666;">
            Se você não solicitou este link, ignore este email.
          </p>
        </div>
      `,
    });
    return { success: true, message: 'Magic link email sent.', return: sentInformation };
  } catch (error) {
    if (env.NODE_ENV === 'dev') {
      return { success: true, message: `[DEV] Magic link: ${magicLinkUrl}` };
    }
    return { success: false, message: 'Falha ao enviar email.', return: error };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(auth): add magic link email template to EmailService"
```

---

### Task 25: Data Migration Script

**Files:**

- Create: `prisma/migrations/auth-links-seed.ts` (or add to `prisma/seed.ts`)

- [ ] **Step 1: Write migration script**

```typescript
async function migrateAuthLinks() {
  // 1. Create EMAIL AuthLinks for all existing users
  const users = await prisma.user.findMany({
    where: { deletedAt: null, email: { not: null } },
    select: { id: true, email: true, password_hash: true },
  });

  for (const user of users) {
    const existing = await prisma.authLink.findFirst({
      where: { userId: user.id, provider: 'EMAIL', unlinkedAt: null },
    });
    if (!existing && user.email && user.password_hash) {
      await prisma.authLink.create({
        data: {
          userId: user.id,
          provider: 'EMAIL',
          identifier: user.email.toLowerCase(),
          credential: user.password_hash,
          status: 'ACTIVE',
        },
      });
    }
  }

  // 2. Create CPF AuthLinks for employees with user accounts
  const employees = await prisma.employee.findMany({
    where: { userId: { not: null }, deletedAt: null, cpf: { not: null } },
    select: { userId: true, cpf: true, tenantId: true },
  });

  for (const emp of employees) {
    if (!emp.userId || !emp.cpf) continue;
    const cpfClean = emp.cpf.replace(/[\.\-\/]/g, '');
    const existing = await prisma.authLink.findFirst({
      where: { userId: emp.userId, provider: 'CPF', unlinkedAt: null },
    });
    if (!existing) {
      const user = await prisma.user.findUnique({
        where: { id: emp.userId },
        select: { password_hash: true },
      });
      if (user?.password_hash) {
        await prisma.authLink.create({
          data: {
            userId: emp.userId,
            provider: 'CPF',
            identifier: cpfClean,
            credential: user.password_hash,
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  // 3. Create default TenantAuthConfig for all tenants
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  for (const tenant of tenants) {
    await prisma.tenantAuthConfig.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        allowedMethods: ['EMAIL'],
        magicLinkEnabled: false,
        magicLinkExpiresIn: 15,
      },
      update: {},
    });
  }
}
```

- [ ] **Step 2: Integrate into seed.ts or run as standalone**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): add data migration script for AuthLink seed"
```

---

### Task 26: Update Existing Login Endpoint (Backward Compat)

**Files:**

- Modify: `src/use-cases/core/auth/authenticate-with-password.ts`

- [ ] **Step 1: Add graceful AuthLink fallback**

At the beginning of `execute()`, after finding user by email:

```typescript
// Graceful migration: ensure AuthLink exists for this user
const existingLink = await this.authLinksRepository.findByProviderAndIdentifier(
  'EMAIL',
  email.value.toLowerCase(),
);
if (!existingLink && existingUser.password) {
  await this.authLinksRepository.create({
    userId: existingUser.id,
    provider: 'EMAIL',
    identifier: email.value.toLowerCase(),
    credential: existingUser.password.toString(),
  });
}
```

This ensures users who log in via the old endpoint also get their AuthLink created.

- [ ] **Step 2: Update factory to inject AuthLinksRepository**

- [ ] **Step 3: Run existing auth tests to verify backward compat**

Run: `npx vitest run src/use-cases/core/auth/authenticate-with-password.spec.ts`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(auth): add graceful AuthLink migration to legacy login endpoint"
```

---

## Phase 5: Unit Tests — Comprehensive Coverage

### Task 27: Comprehensive Unit Tests for All Use Cases

**Files:**

- All `*.spec.ts` files created in Tasks 10-14

- [ ] **Step 1: Ensure all use cases have complete test coverage**

Minimum test cases per use case:

- `authenticate-unified`: 10 tests (see Task 10)
- `request-magic-link`: 6 tests (see Task 11)
- `verify-magic-link`: 6 tests (see Task 12)
- `link-auth-method`: 4 tests (see Task 13)
- `unlink-auth-method`: 3 tests (see Task 13)
- `toggle-auth-link-status`: 3 tests
- `get-tenant-auth-config`: 2 tests
- `update-tenant-auth-config`: 3 tests
- `get-available-auth-methods`: 2 tests

Total: ~39 unit tests minimum

- [ ] **Step 2: Run all auth tests**

Run: `npx vitest run src/use-cases/core/auth/`
Expected: All PASS

- [ ] **Step 3: Commit any missing tests**

```bash
git commit -m "test(auth): comprehensive unit test coverage for multi-method auth"
```

---

## Phase 6: Frontend — Login + Magic Link

### Task 28: Auth Service — Add Unified Login + Magic Link

**Files:**

- Modify: `OpenSea-APP/src/services/auth/auth.service.ts`

- [ ] **Step 1: Add new methods**

```typescript
async loginUnified(credentials: { identifier: string; password: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/v1/auth/login/unified', credentials);
  if (response.token) this.setToken(response.token);
  if (response.refreshToken) this.setRefreshToken(response.refreshToken);
  return response;
},

async requestMagicLink(identifier: string): Promise<{ message: string }> {
  return apiClient.post('/v1/auth/magic-link/request', { identifier });
},

async verifyMagicLink(token: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/v1/auth/magic-link/verify', { token });
  if (response.token) this.setToken(response.token);
  if (response.refreshToken) this.setRefreshToken(response.refreshToken);
  return response;
},

async getAuthMethods(tenantSlug?: string): Promise<{ methods: string[]; magicLinkEnabled: boolean; defaultMethod: string | null }> {
  const params = tenantSlug ? `?tenantSlug=${tenantSlug}` : '';
  return apiClient.get(`/v1/auth/methods${params}`);
},
```

- [ ] **Step 2: Update login method to use unified endpoint**

Change existing `login()` to call `/v1/auth/login/unified` with `{ identifier: credentials.email, password: credentials.password }`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): add unified login and magic link to auth service"
```

---

### Task 29: Update Login Page — Smart Field

**Files:**

- Modify: `OpenSea-APP/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Update identifier field placeholder and validation**

Change placeholder from "Email ou nome de usuário" to "Email, CPF ou Matrícula".

Change login call from:

```typescript
const result = await login({
  email: value.identifier,
  password: value.password,
});
```

To:

```typescript
const result = await login({
  identifier: value.identifier,
  password: value.password,
});
```

- [ ] **Step 2: Add Magic Link button**

After the password step, add a link/button:

```tsx
<button
  type="button"
  onClick={() => setShowMagicLink(true)}
  className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
>
  Entrar com Magic Link
</button>
```

- [ ] **Step 3: Add Magic Link request flow**

When Magic Link is clicked, show a simple form: identifier field + "Enviar link" button. Call `authService.requestMagicLink(identifier)`. Show success message.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(auth): update login page with smart field and magic link option"
```

---

### Task 30: Magic Link Verify Page

**Files:**

- Create: `OpenSea-APP/src/app/(auth)/magic-link/page.tsx`

- [ ] **Step 1: Create magic link verification page**

This page reads `?token=` from URL, calls `authService.verifyMagicLink(token)`, and redirects on success.

```tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authService } from '@/services/auth/auth.service';

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Link inválido.');
      return;
    }

    authService
      .verifyMagicLink(token)
      .then((response) => {
        setStatus('success');
        // Handle tenant selection / redirect same as login
        if (response.tenant) {
          router.push('/');
        } else if (response.tenants?.length > 1) {
          router.push('/select-tenant');
        } else {
          router.push('/');
        }
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message || 'Link inválido ou expirado.');
      });
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === 'loading' && <p>Verificando...</p>}
      {status === 'error' && (
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <a href="/login" className="text-violet-600 hover:underline">
            Voltar ao login
          </a>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(auth): add magic link verification page"
```

---

### Task 31: Auth Context — Update Login Signature

**Files:**

- Modify: `OpenSea-APP/src/contexts/auth-context.tsx`

- [ ] **Step 1: Change login to accept identifier instead of email**

Update `LoginCredentials` type:

```typescript
interface LoginCredentials {
  identifier: string; // was: email
  password: string;
}
```

Update `login` function to call `authService.loginUnified(credentials)` and save account with `identifier` instead of `email`.

- [ ] **Step 2: Update fast-login page references if needed**

Fast-login uses `loginWithPin` which doesn't change.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): update auth context for unified login"
```

---

## Phase 7: Frontend — Profile (Connected Accounts)

### Task 32: Auth Links Service

**Files:**

- Create: `OpenSea-APP/src/services/auth/auth-links.service.ts`

- [ ] **Step 1: Create service**

```typescript
import { apiClient } from '@/lib/api-client';

export interface AuthLinkDTO {
  id: string;
  provider: string;
  identifier: string;
  hasCredential: boolean;
  status: string;
  linkedAt: string;
  lastUsedAt: string | null;
}

export const authLinksService = {
  async listMine(): Promise<{ authLinks: AuthLinkDTO[] }> {
    return apiClient.get('/v1/users/me/auth-links');
  },

  async link(data: {
    provider: string;
    identifier: string;
    currentPassword: string;
  }): Promise<{ authLink: AuthLinkDTO }> {
    return apiClient.post('/v1/users/me/auth-links', data);
  },

  async toggleStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<{ authLink: AuthLinkDTO }> {
    return apiClient.patch(`/v1/users/me/auth-links/${id}`, { status });
  },

  async unlink(id: string): Promise<void> {
    return apiClient.delete(`/v1/users/me/auth-links/${id}`);
  },

  async listForUser(userId: string): Promise<{ authLinks: AuthLinkDTO[] }> {
    return apiClient.get(`/v1/users/${userId}/auth-links`);
  },

  async adminLink(
    userId: string,
    data: { provider: string; identifier: string },
  ): Promise<{ authLink: AuthLinkDTO }> {
    return apiClient.post(`/v1/users/${userId}/auth-links`, data);
  },

  async adminToggle(
    userId: string,
    linkId: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<{ authLink: AuthLinkDTO }> {
    return apiClient.patch(`/v1/users/${userId}/auth-links/${linkId}`, {
      status,
    });
  },

  async adminUnlink(userId: string, linkId: string): Promise<void> {
    return apiClient.delete(`/v1/users/${userId}/auth-links/${linkId}`);
  },

  async getTenantAuthConfig(): Promise<TenantAuthConfigDTO> {
    return apiClient.get('/v1/tenant-auth-config');
  },

  async updateTenantAuthConfig(
    data: Partial<TenantAuthConfigDTO>,
  ): Promise<TenantAuthConfigDTO> {
    return apiClient.put('/v1/tenant-auth-config', data);
  },
};
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(auth): add auth links frontend service"
```

---

### Task 33: Profile — Connected Accounts Section

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/profile/page.tsx` (or equivalent profile/settings page)

- [ ] **Step 1: Add "Contas Conectadas" section to profile**

Create a new tab or CollapsibleSection in the profile page showing all AuthLinks:

```tsx
<CollapsibleSection
  icon={Link2}
  title="Contas Conectadas"
  subtitle="Gerencie seus métodos de login"
>
  <div className="space-y-3">
    {authLinks.map((link) => (
      <div
        key={link.id}
        className="flex items-center justify-between p-4 rounded-lg border bg-muted/20"
      >
        <div className="flex items-center gap-3">
          <ProviderIcon provider={link.provider} />
          <div>
            <p className="font-medium text-sm">
              {PROVIDER_LABELS[link.provider]}
            </p>
            <p className="text-xs text-muted-foreground">{link.identifier}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={link.status === 'ACTIVE' ? 'success' : 'secondary'}>
            {link.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
          </Badge>
          <DropdownMenu>{/* Toggle active/inactive, Unlink */}</DropdownMenu>
        </div>
      </div>
    ))}

    {/* Add new method button */}
    <Button variant="outline" size="sm" onClick={() => setShowLinkModal(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Vincular Método
    </Button>
  </div>
</CollapsibleSection>
```

PROVIDER_LABELS map:

```typescript
const PROVIDER_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  CPF: 'CPF',
  ENROLLMENT: 'Matrícula',
  GOOGLE: 'Google',
  MICROSOFT: 'Microsoft',
  APPLE: 'Apple',
  GITHUB: 'GitHub',
};
```

- [ ] **Step 2: Add link method modal (StepWizardDialog)**

Wizard with 2 steps:

1. Select provider (EMAIL/CPF/ENROLLMENT) + enter identifier
2. Confirm current password

- [ ] **Step 3: Add unlink confirmation via VerifyActionPinModal**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(auth): add Connected Accounts section to user profile"
```

---

## Phase 8: Frontend — Admin

### Task 34: Admin User Detail — Auth Links Tab

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/(entities)/users/[id]/page.tsx`

- [ ] **Step 1: Add "Métodos de Login" tab to user detail**

Add a 4th tab to the existing Tabs component:

```tsx
<TabsTrigger value="auth-links">Métodos de Login</TabsTrigger>
```

Content shows all AuthLinks for the user with admin controls (activate, deactivate, unlink, add).

- [ ] **Step 2: Admin can link CPF/Matrícula for user**

Simple form: select provider, enter identifier. No password required (admin privilege).

- [ ] **Step 3: Admin unlink uses VerifyActionPinModal (destructive)**

- [ ] **Step 4: All actions show audit trail info**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(auth): add auth links management tab to admin user detail"
```

---

### Task 35: Admin Settings — Authentication Configuration

**Files:**

- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/admin/settings/auth/page.tsx`

- [ ] **Step 1: Create authentication settings page**

Layout with CollapsibleSections:

Section 1: "Métodos de Login" — checkboxes/switches for each provider
Section 2: "Magic Link" — enable toggle + expiration time input
Section 3: "Método Padrão" — select dropdown

Pattern follows `finance/settings/page.tsx` with Switch toggles inside bordered rows.

```tsx
<div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border">
  <div>
    <p className="font-medium">Login por CPF</p>
    <p className="text-sm text-muted-foreground">
      Permite que usuários façam login usando CPF + senha
    </p>
  </div>
  <Switch
    checked={config.allowedMethods.includes('CPF')}
    onCheckedChange={(checked) => toggleMethod('CPF', checked)}
  />
</div>
```

- [ ] **Step 2: Add navigation entry in admin module**

Add link to auth settings page in the admin navigation/sidebar if applicable.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): add authentication configuration page in admin settings"
```

---

## Phase 9: Frontend — HR Integration

### Task 36: Employee Creation — Auth Link Checkboxes

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/hr/(entities)/employees/...` (creation form/modal)

- [ ] **Step 1: Add auth link checkboxes to "Criar Funcionário com Conta"**

When creating employee with user account:

- If CPF is filled and tenant allows CPF: show checkbox "Habilitar login por CPF" (default ON)
- If registration number is filled and tenant allows ENROLLMENT: show checkbox "Habilitar login por matrícula"

Fetch tenant auth config to know which methods are allowed:

```typescript
const { data: authConfig } = useQuery({
  queryKey: ['tenant-auth-config'],
  queryFn: () => authLinksService.getTenantAuthConfig(),
});

const showCpfCheckbox =
  !!cpfValue && authConfig?.allowedMethods?.includes('CPF');
const showEnrollmentCheckbox =
  !!registrationNumber && authConfig?.allowedMethods?.includes('ENROLLMENT');
```

- [ ] **Step 2: Pass checkbox values to API call**

The backend already handles creating AuthLinks based on the tenant config (Task 23). The frontend just needs to pass the flag or let the backend auto-create.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(auth): add auth link checkboxes to HR employee creation"
```

---

## Phase 10: Frontend — Central (Super Admin)

### Task 37: Central — Tenant Auth Config in Tenant Detail

**Files:**

- Modify: Central tenant detail page (super admin view of tenant)

- [ ] **Step 1: Add "Autenticação" section to tenant detail in Central**

When viewing a tenant in Central, super admin can see and configure the tenant's auth methods. Uses same components as admin settings but calls admin API with specific tenantId.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(auth): add auth config to Central tenant management"
```

---

## Phase 11: E2E Tests + Final Validation

### Task 38: E2E Tests — Critical Auth Flows

**Files:**

- Create: `src/http/controllers/core/auth/v1-authenticate-unified.e2e.spec.ts`
- Create: `src/http/controllers/core/auth/v1-magic-link.e2e.spec.ts`
- Create: `src/http/controllers/core/me/v1-auth-links.e2e.spec.ts`

- [ ] **Step 1: Unified login E2E tests**

Test cases:

1. Login with email + password (backward compat)
2. Login with CPF + password
3. Login with enrollment + password
4. Reject wrong password
5. Reject inactive method
6. Auto-tenant selection with single tenant

- [ ] **Step 2: Magic link E2E tests**

Test cases:

1. Request magic link → verify token → get JWT
2. Reject expired token
3. Reject used token

- [ ] **Step 3: Auth links management E2E tests**

Test cases:

1. List my auth links
2. Link CPF method
3. Toggle status
4. Unlink method
5. Reject unlinking last method

- [ ] **Step 4: Run full test suite**

Run: `npm run test && npm run lint`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git commit -m "test(auth): add E2E tests for unified login, magic link, and auth link management"
```

---

### Task 39: Update E2E Test Factory

**Files:**

- Modify: `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts`

- [ ] **Step 1: Update factory to create AuthLink(EMAIL) alongside User**

After creating user in the test factory, also create an AuthLink:

```typescript
await prisma.authLink.create({
  data: {
    userId: user.id,
    provider: 'EMAIL',
    identifier: email.toLowerCase(),
    credential: passwordHash,
    status: 'ACTIVE',
  },
});
```

- [ ] **Step 2: Run existing E2E tests to verify no regressions**

Run: `npm run test:e2e`
Expected: All existing tests PASS

- [ ] **Step 3: Commit**

```bash
git commit -m "test(auth): update E2E test factory to create AuthLink"
```

---

### Task 40: Final Validation — TypeScript + Lint + Full Test Suite

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Lint check**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Full unit test suite**

Run: `npm run test`
Expected: All pass (including 39+ new auth tests)

- [ ] **Step 4: Full E2E test suite**

Run: `npm run test:e2e`
Expected: All pass

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git commit -m "fix(auth): address final validation issues"
```

---

## Summary

| Phase | Tasks | Description                                                                      |
| ----- | ----- | -------------------------------------------------------------------------------- |
| 1     | 1-8   | Foundation: Schema, Entities, Repositories, Mappers, Permissions                 |
| 2     | 9-15  | Core Use Cases: Unified Login, Magic Link, Auth Link Management, Credential Sync |
| 3     | 16-21 | Controllers: HTTP endpoints (16 new endpoints)                                   |
| 4     | 22-26 | Integration: User/Employee creation, Email service, Migration, Backward compat   |
| 5     | 27    | Comprehensive unit test coverage (~39 tests)                                     |
| 6     | 28-31 | Frontend: Login page, Magic Link, Auth context                                   |
| 7     | 32-33 | Frontend: Profile — Connected Accounts                                           |
| 8     | 34-35 | Frontend: Admin — Auth Links tab + Auth Settings                                 |
| 9     | 36    | Frontend: HR — Employee creation checkboxes                                      |
| 10    | 37    | Frontend: Central — Super admin auth config                                      |
| 11    | 38-40 | E2E Tests + Final Validation                                                     |

**Total: 40 tasks, ~11 phases, estimated ~39 unit tests + ~14 E2E tests**
