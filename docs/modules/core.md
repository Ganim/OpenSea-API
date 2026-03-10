# Module: Core

## Overview

O módulo Core é a fundação de toda a plataforma OpenSea. Ele gerencia autenticação de usuários,
ciclo de vida de sessões, multi-tenancy, controle de planos e feature flags, além de fornecer o
sistema de templates de etiquetas compartilhados entre tenants.

**Responsabilidades principais:**
- Registro e autenticação de usuários (e-mail + senha, PIN, forçar reset de senha)
- Emissão e rotação de tokens JWT e refresh tokens
- Gerenciamento de sessões (criar, listar, revogar, expirar, logout)
- Seleção de tenant e emissão de JWT com escopo de tenant
- Operações do perfil do próprio usuário (`/me`)
- Administração de usuários por gestores (lista, busca, alteração de dados)
- Criação e administração de tenants, planos e feature flags (painel Central / Super Admin)
- CRUD de templates de etiquetas por tenant

**Dependências com outros módulos:**
- `rbac` — verificação de permissões em todas as rotas protegidas
- `audit` — log de auditoria em operações sensíveis (mudança de e-mail, status de tenant, etc.)
- `hr` — endpoints `/me` que expõem dados de funcionário, banco de horas e ausências
- `sales` — notificações de preferências via `/me`

---

## Entities

### User (Prisma: `users`)

| Campo | Tipo (DB) | Obrigatório | Validação | Descrição |
|-------|-----------|-------------|-----------|-----------|
| `id` | `String @id` (UUID) | Sim | UUID v4 | Identificador único |
| `username` | `VarChar(32)` | Não | 3-20 chars, `[a-zA-Z0-9_]` | Nome de usuário (gerado automaticamente se omitido) |
| `email` | `VarChar(254)` | Sim | formato RFC 5322, lowercase | E-mail de acesso |
| `password_hash` | `VarChar(100)` | Sim | bcrypt | Hash da senha |
| `lastLoginIp` | `String?` | Não | IPv4 ou IPv6 | IP do último login |
| `failedLoginAttempts` | `Int` | Sim | default 0 | Contador de tentativas falhas |
| `blockedUntil` | `DateTime?` | Não | — | Bloqueio temporário após exceder tentativas |
| `passwordResetToken` | `String?` | Não | — | Token de redefinição de senha |
| `passwordResetExpires` | `DateTime?` | Não | — | Expiração do token de reset |
| `forcePasswordReset` | `Boolean` | Sim | default false | Indica reset obrigatório no próximo login |
| `forcePasswordResetReason` | `VarChar(255)?` | Não | — | Motivo do reset forçado |
| `forcePasswordResetRequestedBy` | `String?` | Não | UUID referência | ID do admin que solicitou |
| `forcePasswordResetRequestedAt` | `DateTime?` | Não | — | Momento da solicitação |
| `accessPinHash` | `VarChar(100)?` | Não | bcrypt | PIN de acesso rápido |
| `actionPinHash` | `VarChar(100)?` | Não | bcrypt | PIN para ações sensíveis |
| `lastLoginAt` | `DateTime?` | Não | — | Timestamp do último login bem-sucedido |
| `deletedAt` | `DateTime?` | Não | — | Soft delete |
| `createdAt` | `DateTime` | Sim | `@default(now())` | Data de criação |
| `updatedAt` | `DateTime` | Sim | `@updatedAt` | Última atualização |

**Value Objects:**

| Value Object | Validação | Comportamento |
|---|---|---|
| `Email` | Regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Normalizado: `trim().toLowerCase()` |
| `Username` | Regex `^[a-zA-Z0-9_]{3,20}$` | Normalizado: `trim().toLowerCase().replace(/\s+/, '_')`. Método `Username.random()` gera `user{8-chars-uuid}` |
| `Password` | — | Hash bcrypt; `Password.compare()` para verificação |
| `Token` | `string`, mínimo 16 caracteres | Possui `isExpired()` baseado em `expiresAt` |
| `IpAddress` | `isIPv4 || isIPv6` (Node.js `net`) | Imutável após criação |
| `Url` | — | Aceita string vazia (avatar opcional) |

**Relationships:**
- `User` 1-N `Session`
- `User` 1-N `RefreshToken`
- `User` 1-1 `UserProfile`
- `User` N-N `Tenant` (via `TenantUser`)
- `User` N-N `PermissionGroup` (via `UserPermissionGroup`)
- `User` N-N `Permission` (via `UserDirectPermission`)

---

### UserProfile (Prisma: `user_profiles`)

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|-------------|-----------|-----------|
| `id` | UUID | Sim | — | Identificador único |
| `userId` | UUID (FK) | Sim | `@unique` | Referência ao User |
| `name` | `VarChar(64)` | Sim | default `""` | Primeiro nome |
| `surname` | `VarChar(64)` | Sim | default `""` | Sobrenome |
| `birthday` | `DateTime? @db.Date` | Não | — | Data de nascimento |
| `location` | `VarChar(128)` | Sim | default `""` | Localização |
| `bio` | `VarChar(256)` | Sim | default `""` | Biografia |
| `avatarUrl` | `VarChar(512)` | Sim | default `""` | URL do avatar |
| `createdAt` | `DateTime` | Sim | `@default(now())` | Data de criação |
| `updatedAt` | `DateTime` | Sim | `@updatedAt` | Última atualização |

**Index:** `@@index([userId])`

---

### Session (Prisma: `sessions`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `userId` | UUID (FK) | Sim | Usuário dono da sessão |
| `tenantId` | UUID? (FK) | Não | Tenant selecionado (preenchido após `select-tenant`) |
| `ip` | `VarChar(64)` | Sim | IP de origem |
| `createdAt` | `DateTime` | Sim | Criação da sessão |
| `expiredAt` | `DateTime?` | Não | Preenchido no logout |
| `revokedAt` | `DateTime?` | Não | Preenchido na revogação administrativa |
| `lastUsedAt` | `DateTime?` | Não | Última utilização |
| `userAgent` | `VarChar(512)?` | Não | User-Agent do cliente |
| `deviceType` | `VarChar(32)?` | Não | `desktop`, `mobile`, `tablet`, `bot`, `unknown` |
| `deviceName` | `VarChar(128)?` | Não | Ex: `iPhone 15` |
| `browserName` | `VarChar(64)?` | Não | Ex: `Chrome` |
| `browserVersion` | `VarChar(32)?` | Não | Ex: `120.0` |
| `osName` | `VarChar(64)?` | Não | Ex: `Windows`, `iOS` |
| `osVersion` | `VarChar(32)?` | Não | Ex: `11` |
| `country` | `VarChar(64)?` | Não | Geolocalização por IP |
| `countryCode` | `VarChar(2)?` | Não | Ex: `BR` |
| `region` | `VarChar(64)?` | Não | Estado/Região |
| `city` | `VarChar(64)?` | Não | Cidade |
| `timezone` | `VarChar(64)?` | Não | Ex: `America/Sao_Paulo` |
| `latitude` | `Float?` | Não | Latitude |

---

### RefreshToken (Prisma: `refresh_tokens`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `userId` | UUID (FK) | Sim | Usuário dono |
| `sessionId` | UUID (FK) | Sim | Sessão associada |
| `tenantId` | UUID? (FK) | Não | Tenant (quando aplicável) |
| `token` | `VarChar(2048) @unique` | Sim | Token JWT assinado |
| `expiresAt` | `DateTime` | Sim | Data de expiração |
| `createdAt` | `DateTime` | Sim | Data de emissão |
| `revokedAt` | `DateTime?` | Não | Data de revogação |

**Indexes:** `[userId]`, `[sessionId]`, `[tenantId]`, `[token]`

---

### Tenant (Prisma: `tenants`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `name` | `VarChar(128)` | Sim | Nome da empresa/organização |
| `slug` | `VarChar(128) @unique` | Sim | Identificador amigável único |
| `logoUrl` | `VarChar(500)?` | Não | URL do logotipo |
| `status` | `TenantStatusEnum` | Sim | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `settings` | `Json` | Sim | Configurações livres (default `{}`) |
| `metadata` | `Json` | Sim | Metadados internos (default `{}`) |
| `deletedAt` | `DateTime?` | Não | Soft delete |
| `createdAt` | `DateTime` | Sim | Data de criação |
| `updatedAt` | `DateTime` | Sim | Última atualização |

---

### Plan (Prisma: `plans`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `name` | `VarChar(64) @unique` | Sim | Nome do plano |
| `tier` | `PlanTierEnum` | Sim | `FREE`, `BASIC`, `PRO`, `ENTERPRISE` (ou equivalentes) |
| `description` | `VarChar(500)?` | Não | Descrição do plano |
| `price` | `Float` | Sim | Preço (default 0) |
| `isActive` | `Boolean` | Sim | Disponível para novos tenants (default true) |
| `maxUsers` | `Int` | Sim | Limite de usuários (default 5) |
| `maxWarehouses` | `Int` | Sim | Limite de armazéns (default 1) |
| `maxProducts` | `Int` | Sim | Limite de produtos (default 100) |
| `maxStorageMb` | `Int` | Sim | Limite de armazenamento em MB (0 = ilimitado) |

**Indexes:** `[tier]`, `[isActive]`

---

### PlanModule (Prisma: `plan_modules`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `planId` | UUID (FK) | Sim | Plano pai |
| `module` | `SystemModuleEnum` | Sim | Módulo habilitado (ex: `STOCK`, `HR`, `SALES`) |

**Constraint:** `@@unique([planId, module])` — um plano não pode ter o mesmo módulo duplicado.

---

### TenantPlan (Prisma: `tenant_plans`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `tenantId` | UUID (FK) | Sim | Tenant assinante |
| `planId` | UUID (FK) | Sim | Plano contratado |
| `startsAt` | `DateTime` | Sim | Início da vigência (default now) |
| `expiresAt` | `DateTime?` | Não | Fim da vigência (null = sem expiração) |

---

### TenantUser (Prisma: `tenant_users`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `tenantId` | UUID (FK) | Sim | Tenant |
| `userId` | UUID (FK) | Sim | Usuário membro |
| `role` | `VarChar(32)` | Sim | Papel no tenant (default `"member"`) |
| `securityKeyHash` | `VarChar(256)?` | Não | Hash da chave de segurança (para ações sensíveis) |
| `joinedAt` | `DateTime` | Sim | Data de ingresso |
| `deletedAt` | `DateTime?` | Não | Soft delete (saída do tenant) |

**Constraint:** `@@unique([tenantId, userId, deletedAt])` — permite reingressar após saída.

---

### TenantFeatureFlag (Prisma: `tenant_feature_flags`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `tenantId` | UUID (FK) | Sim | Tenant |
| `flag` | `VarChar(64)` | Sim | Nome da feature flag |
| `enabled` | `Boolean` | Sim | Ativada ou desativada (default false) |
| `metadata` | `Json` | Sim | Configurações extras (default `{}`) |

**Constraint:** `@@unique([tenantId, flag])`

---

### LabelTemplate (Prisma: `label_templates`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `name` | `VarChar(255)` | Sim | Nome do template |
| `description` | `Text?` | Não | Descrição opcional |
| `isSystem` | `Boolean` | Sim | Templates do sistema (não editáveis/deletáveis) |
| `width` | `Int` | Sim | Largura em mm (10–300) |
| `height` | `Int` | Sim | Altura em mm (10–300) |
| `grapesJsData` | `Text` | Sim | JSON do projeto GrapesJS |
| `compiledHtml` | `Text?` | Não | HTML compilado para impressão |
| `compiledCss` | `Text?` | Não | CSS compilado para impressão |
| `thumbnailUrl` | `VarChar(500)?` | Não | URL da miniatura gerada |
| `tenantId` | UUID (FK) | Sim | Tenant dono |
| `createdById` | UUID (FK) | Sim | Usuário criador |

---

## Endpoints

### Auth — Registro e Autenticação

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `POST` | `/v1/auth/register/password` | — (público) | Registra novo usuário |
| `POST` | `/v1/auth/login/password` | — (público) | Autentica com e-mail e senha |
| `POST` | `/v1/auth/password-reset/send` | — (público) | Envia token de redefinição por e-mail |
| `POST` | `/v1/auth/password-reset/reset` | — (público) | Redefine senha via token |

### Auth — Tenant Selection

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `GET` | `/v1/auth/tenants` | `verifyJwt` | Lista tenants do usuário autenticado |
| `POST` | `/v1/auth/select-tenant` | `verifyJwt` | Seleciona tenant e emite JWT com escopo |

### Sessions

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `GET` | `/v1/sessions/me` | `verifyJwt` | Lista todas as sessões do próprio usuário |
| `POST` | `/v1/sessions/logout` | `verifyJwt` | Encerra a sessão atual (logout) |
| `POST` | `/v1/sessions/refresh` | `verifyJwt` | Renova o access token via refresh token |
| `DELETE` | `/v1/sessions/me/:sessionId` | `verifyJwt` | Revoga uma sessão própria específica |
| `GET` | `/v1/sessions` | `verifyJwt` + `core.sessions.list` | Lista todas as sessões ativas do sistema |
| `GET` | `/v1/sessions/user/:userId` | `verifyJwt` + `core.sessions.list` | Lista sessões de um usuário específico |
| `GET` | `/v1/sessions/user/:userId/by-date` | `verifyJwt` + `core.sessions.list` | Lista sessões de usuário filtradas por data |
| `DELETE` | `/v1/sessions/:sessionId/revoke` | `verifyJwt` + `core.sessions.revoke` | Revoga sessão de qualquer usuário (admin) |
| `DELETE` | `/v1/sessions/:sessionId/expire` | `verifyJwt` + `core.sessions.revoke` | Expira sessão de qualquer usuário (admin) |

### Me (perfil próprio)

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `GET` | `/v1/me` | `verifyJwt` | Retorna dados do usuário autenticado |
| `PATCH` | `/v1/me/email` | `verifyJwt` | Altera e-mail do usuário autenticado |
| `PATCH` | `/v1/me/password` | `verifyJwt` | Altera senha do usuário autenticado |
| `PATCH` | `/v1/me/username` | `verifyJwt` | Altera username do usuário autenticado |
| `PATCH` | `/v1/me/profile` | `verifyJwt` | Altera dados de perfil (nome, bio, etc.) |
| `DELETE` | `/v1/me` | `verifyJwt` | Exclui (soft delete) a própria conta |
| `GET` | `/v1/me/permissions` | `verifyJwt` + `verifyTenant` | Lista permissões do usuário no tenant |
| `GET` | `/v1/me/groups` | `verifyJwt` + `verifyTenant` | Lista grupos de permissão do usuário |
| `GET` | `/v1/me/audit-logs` | `verifyJwt` + `verifyTenant` | Lista logs de auditoria do próprio usuário |
| `GET` | `/v1/me/notifications` | `verifyJwt` | Lista preferências de notificação |
| `POST` | `/v1/me/notifications` | `verifyJwt` | Cria preferência de notificação |
| `PATCH` | `/v1/me/notifications/:id` | `verifyJwt` | Atualiza preferência de notificação |
| `DELETE` | `/v1/me/notifications/:id` | `verifyJwt` | Remove preferência de notificação |
| `GET` | `/v1/me/employee` | `verifyJwt` + `verifyTenant` | Retorna dados de funcionário do usuário |
| `GET` | `/v1/me/time-bank` | `verifyJwt` + `verifyTenant` | Retorna banco de horas |
| `GET` | `/v1/me/absences` | `verifyJwt` + `verifyTenant` | Lista ausências do usuário |
| `GET` | `/v1/me/overtime` | `verifyJwt` + `verifyTenant` | Lista horas extras do usuário |
| `POST` | `/v1/me/overtime` | `verifyJwt` + `verifyTenant` | Solicita horas extras |
| `POST` | `/v1/me/vacation` | `verifyJwt` + `verifyTenant` | Solicita férias |
| `GET` | `/v1/me/payroll` | `verifyJwt` + `verifyTenant` | Lista itens de folha de pagamento |
| `GET` | `/v1/me/requests` | `verifyJwt` + `verifyTenant` | Lista requisições do usuário |

### Users (gestão administrativa)

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `POST` | `/v1/users` | `verifyJwt` + `core.users.create` | Cria novo usuário |
| `GET` | `/v1/users` | `verifyJwt` + `core.users.list` | Lista todos os usuários |
| `GET` | `/v1/users/online` | `verifyJwt` | Lista usuários online (sessões ativas) |
| `GET` | `/v1/users/:userId` | `verifyJwt` | Busca usuário por ID |
| `GET` | `/v1/users/email/:email` | `verifyJwt` | Busca usuário por e-mail |
| `GET` | `/v1/users/username/:username` | `verifyJwt` | Busca usuário por username |
| `PATCH` | `/v1/users/:userId/email` | `verifyJwt` + `core.users.update` | Altera e-mail de outro usuário |
| `PATCH` | `/v1/users/:userId/password` | `verifyJwt` + `core.users.update` | Altera senha de outro usuário |
| `PATCH` | `/v1/users/:userId/username` | `verifyJwt` + `core.users.update` | Altera username de outro usuário |
| `PATCH` | `/v1/users/:userId/profile` | `verifyJwt` + `core.users.update` | Altera perfil de outro usuário |
| `POST` | `/v1/users/:userId/force-password-reset` | `verifyJwt` + `core.users.manage` | Força reset de senha no próximo login |

### Tenants (operações do tenant pelo próprio usuário)

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `POST` | `/v1/tenants` | `verifyJwt` | Cria novo tenant |
| `GET` | `/v1/tenants/:id` | `verifyJwt` + `verifyTenant` | Retorna dados do tenant atual |
| `PATCH` | `/v1/tenants/:id` | `verifyJwt` + `verifyTenant` | Atualiza dados do tenant |
| `POST` | `/v1/tenants/:id/users/invite` | `verifyJwt` + `verifyTenant` | Convida usuário para o tenant |
| `DELETE` | `/v1/tenants/:id/users/:userId` | `verifyJwt` + `verifyTenant` | Remove usuário do tenant |

### Label Templates

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `POST` | `/v1/label-templates` | `verifyJwt` + `verifyTenant` + `core.label-templates.create` | Cria template de etiqueta |
| `GET` | `/v1/label-templates` | `verifyJwt` + `verifyTenant` + `core.label-templates.list` | Lista templates do tenant |
| `GET` | `/v1/label-templates/system` | `verifyJwt` + `verifyTenant` | Lista templates do sistema |
| `GET` | `/v1/label-templates/:id` | `verifyJwt` + `verifyTenant` + `core.label-templates.read` | Retorna template por ID |
| `PATCH` | `/v1/label-templates/:id` | `verifyJwt` + `verifyTenant` + `core.label-templates.update` | Atualiza template |
| `DELETE` | `/v1/label-templates/:id` | `verifyJwt` + `verifyTenant` + `core.label-templates.delete` | Remove template |
| `POST` | `/v1/label-templates/:id/duplicate` | `verifyJwt` + `verifyTenant` + `core.label-templates.duplicate` | Duplica template |
| `POST` | `/v1/label-templates/:id/thumbnail` | `verifyJwt` + `verifyTenant` | Gera miniatura do template |

### Admin — Tenants (Super Admin)

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `GET` | `/v1/admin/tenants` | `verifyJwt` + `verifySuperAdmin` | Lista todos os tenants (paginado, com filtros) |
| `GET` | `/v1/admin/tenants/:id` | `verifyJwt` + `verifySuperAdmin` | Detalhes completos do tenant (plano, usuários, flags) |
| `POST` | `/v1/admin/tenants` | `verifyJwt` + `verifySuperAdmin` | Cria novo tenant |
| `PATCH` | `/v1/admin/tenants/:id` | `verifyJwt` + `verifySuperAdmin` | Atualiza dados do tenant |
| `DELETE` | `/v1/admin/tenants/:id` | `verifyJwt` + `verifySuperAdmin` | Remove (soft delete) tenant |
| `PUT` | `/v1/admin/tenants/:id/status` | `verifyJwt` + `verifySuperAdmin` | Altera status do tenant |
| `PUT` | `/v1/admin/tenants/:id/plan` | `verifyJwt` + `verifySuperAdmin` | Altera plano do tenant |
| `PATCH` | `/v1/admin/tenants/:id/feature-flags` | `verifyJwt` + `verifySuperAdmin` | Gerencia feature flags |
| `GET` | `/v1/admin/tenants/:id/feature-flags` | `verifyJwt` + `verifySuperAdmin` | Lista feature flags do tenant |
| `GET` | `/v1/admin/tenants/:id/users` | `verifyJwt` + `verifySuperAdmin` | Lista usuários do tenant |
| `POST` | `/v1/admin/tenants/:id/users` | `verifyJwt` + `verifySuperAdmin` | Adiciona usuário ao tenant |
| `DELETE` | `/v1/admin/tenants/:id/users/:userId` | `verifyJwt` + `verifySuperAdmin` | Remove usuário do tenant |
| `PUT` | `/v1/admin/tenants/:id/users/:userId/security-key` | `verifyJwt` + `verifySuperAdmin` | Define chave de segurança do usuário no tenant |

### Admin — Plans (Super Admin)

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `GET` | `/v1/admin/plans` | `verifyJwt` + `verifySuperAdmin` | Lista todos os planos |
| `GET` | `/v1/admin/plans/:id` | `verifyJwt` + `verifySuperAdmin` | Detalhes do plano com módulos |
| `POST` | `/v1/admin/plans` | `verifyJwt` + `verifySuperAdmin` | Cria novo plano |
| `PUT` | `/v1/admin/plans/:id` | `verifyJwt` + `verifySuperAdmin` | Atualiza plano |
| `DELETE` | `/v1/admin/plans/:id` | `verifyJwt` + `verifySuperAdmin` | Desativa plano |
| `PUT` | `/v1/admin/plans/:id/modules` | `verifyJwt` + `verifySuperAdmin` | Define os módulos do plano |

### Admin — Dashboard (Super Admin)

| Método | Caminho | Middleware | Descrição |
|--------|---------|------------|-----------|
| `GET` | `/v1/admin/dashboard` | `verifyJwt` + `verifySuperAdmin` | Estatísticas globais do sistema |

---

### Request / Response Examples

#### POST `/v1/auth/register/password`

```json
// Request
{
  "email": "joao@empresa.com",
  "password": "Senha@Segura123",
  "username": "joao_silva",
  "profile": {
    "name": "João",
    "surname": "Silva"
  }
}

// Response 201
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "joao@empresa.com",
    "username": "joao_silva",
    "lastLoginAt": null,
    "profile": {
      "id": "...",
      "name": "João",
      "surname": "Silva",
      "bio": "",
      "location": "",
      "avatarUrl": ""
    }
  }
}
```

#### POST `/v1/auth/login/password`

```json
// Request
{
  "email": "joao@empresa.com",
  "password": "Senha@Segura123"
}

// Response 200
{
  "user": { "id": "...", "email": "joao@empresa.com", "username": "joao_silva" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "sess-uuid-..."
}
```

#### POST `/v1/auth/select-tenant`

```json
// Request
{
  "tenantId": "tenant-uuid-..."
}

// Response 200
{
  "token": "eyJ... (JWT com tenantId no payload)"
}
```

#### GET `/v1/admin/tenants` (query params)

```
?page=1&limit=20&search=empresa&status=ACTIVE
```

```json
// Response 200
{
  "tenants": [
    {
      "id": "...",
      "name": "Empresa Demo",
      "slug": "empresa-demo",
      "logoUrl": null,
      "status": "ACTIVE",
      "settings": {},
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "perPage": 20,
    "totalPages": 1
  }
}
```

#### GET `/v1/admin/dashboard`

```json
// Response 200
{
  "totalTenants": 42,
  "totalPlans": 4,
  "activePlans": 3,
  "tenantsByStatus": { "ACTIVE": 38, "INACTIVE": 2, "SUSPENDED": 2 },
  "tenantsByTier": { "FREE": 10, "PRO": 32 },
  "monthlyGrowth": [
    { "month": "2026-01", "count": 5 },
    { "month": "2026-02", "count": 8 }
  ],
  "recentActivity": [
    {
      "id": "...",
      "action": "TENANT_STATUS_CHANGE",
      "entity": "Tenant",
      "description": null,
      "createdAt": "2026-03-10T10:00:00.000Z"
    }
  ],
  "totalUsers": 218,
  "mrr": 12500.00
}
```

---

## Business Rules

### Regra 1: Bloqueio por Tentativas Falhas de Login

- Ao falhar a autenticação, `failedLoginAttempts` é incrementado.
- Ao atingir `MAX_ATTEMPTS` (configurado em `src/config/auth.ts`), o campo `blockedUntil` é preenchido com `now() + BLOCK_MINUTES`.
- Enquanto `blockedUntil > now()`, qualquer tentativa de login lança `UserBlockedError` (HTTP 423).
- Após login bem-sucedido, `failedLoginAttempts` é zerado e `blockedUntil` limpo.

### Regra 2: Reset de Senha Forçado

- Um administrador pode definir `forcePasswordReset = true` em qualquer usuário (endpoint `POST /v1/users/:userId/force-password-reset`).
- No próximo login com senha correta, antes de criar a sessão, o sistema detecta `forcePasswordReset = true`.
- Nesse caso, um token temporário de reset (30 minutos) é gerado e retornado com erro `PasswordResetRequiredError` (HTTP 403).
- O usuário deve usar esse token em `POST /v1/auth/password-reset/reset` para definir nova senha.
- Após o reset bem-sucedido, `forcePasswordReset` é automaticamente limpo.

### Regra 3: Soft Delete de Usuário

- `DELETE /v1/me` marca `deletedAt` no usuário (não exclui do banco).
- Usuários com `deletedAt` preenchido são tratados como inexistentes em todas as buscas e autenticações.
- O mesmo padrão se aplica ao `TenantUser`: saída do tenant marca `deletedAt`, permitindo reingresso posterior.

### Regra 4: Fluxo Multi-Tenant de Autenticação

O fluxo completo de autenticação até operações no tenant segue quatro etapas obrigatórias:

```
1. POST /v1/auth/login/password
   → JWT sem tenantId (payload: { sub: userId, isSuperAdmin: bool })

2. GET /v1/auth/tenants
   → Lista tenants disponíveis para o usuário

3. POST /v1/auth/select-tenant { tenantId }
   → JWT com tenantId (payload: { sub: userId, tenantId, isSuperAdmin: bool })

4. Qualquer endpoint com verifyTenant
   → Utiliza tenantId do JWT para isolar dados
```

Rotas com `verifyTenant` rejeitam tokens sem `tenantId` com HTTP 401.

### Regra 5: Templates de Sistema (isSystem)

- Templates com `isSystem = true` são pré-definidos pela plataforma.
- Esses templates não podem ser editados nem excluídos por nenhum usuário do tenant.
- Estão disponíveis para todos os tenants via `GET /v1/label-templates/system`.
- Templates criados por usuários (`isSystem = false`) são isolados por tenant.

### Regra 6: Status do Tenant e Acesso

| Status | Comportamento |
|--------|---------------|
| `ACTIVE` | Acesso normal a todos os recursos |
| `INACTIVE` | Tenant desativado; membros não conseguem selecionar o tenant |
| `SUSPENDED` | Tenant suspenso administrativamente; acesso bloqueado pelo `verifyTenant` |

### Regra 7: Módulos do Plano e Middleware `verifyModule`

- Cada plano define quais módulos estão habilitados via `PlanModule`.
- O middleware `verifyModule` verifica se o tenant possui o módulo necessário para a rota.
- Se o plano do tenant não inclui o módulo, a requisição é rejeitada com HTTP 403.

### Regra 8: Sessão vs. Revogação vs. Expiração

| Operação | Quem executa | Campos alterados |
|----------|-------------|-----------------|
| Logout | Próprio usuário (`/sessions/logout`) | `expiredAt = now()` + refresh token revogado |
| Revogar própria sessão | Próprio usuário (`DELETE /sessions/me/:id`) | `revokedAt = now()` |
| Revogar sessão de terceiro | Admin (`DELETE /sessions/:id/revoke`) | `revokedAt = now()` |
| Expirar sessão | Admin (`DELETE /sessions/:id/expire`) | `expiredAt = now()` |

Uma sessão já expirada ou revogada não pode ser modificada novamente (erro 404).

---

## Permissions

### CORE — Permissões registradas em `permission-codes.ts`

| Código | Descrição | Escopo |
|--------|-----------|--------|
| `core.users.create` | Criar usuários | Gestores |
| `core.users.read` | Visualizar usuário específico | Gestores |
| `core.users.update` | Alterar dados de qualquer usuário | Gestores |
| `core.users.delete` | Excluir usuários | Gestores |
| `core.users.list` | Listar todos os usuários | Gestores |
| `core.users.manage` | Ação administrativa completa (inclui force-password-reset) | Admin |
| `core.sessions.read` | Visualizar sessão específica | Admin |
| `core.sessions.list` | Listar sessões do sistema ou de usuário | Admin |
| `core.sessions.revoke` | Revogar ou expirar sessões de terceiros | Admin |
| `core.sessions.revoke-all` | Revogar todas as sessões do sistema | Admin |
| `core.profiles.read` | Visualizar perfis de outros usuários | Gestores |
| `core.profiles.update` | Alterar perfis de outros usuários | Admin |
| `core.label-templates.create` | Criar templates de etiqueta | Operadores |
| `core.label-templates.read` | Visualizar template específico | Operadores |
| `core.label-templates.update` | Atualizar template | Operadores |
| `core.label-templates.delete` | Excluir template | Gestores |
| `core.label-templates.list` | Listar templates do tenant | Operadores |
| `core.label-templates.duplicate` | Duplicar template | Operadores |
| `core.label-templates.manage` | Gerenciamento completo de templates | Admin |
| `core.teams.create` | Criar times | Gestores |
| `core.teams.read` | Visualizar time | Membros |
| `core.teams.update` | Atualizar time | Gestores |
| `core.teams.delete` | Excluir time | Admin |
| `core.teams.list` | Listar times | Membros |
| `core.teams.manage` | Gerenciamento completo de times | Admin |
| `core.teams.members.add` | Adicionar membro ao time | Gestores |
| `core.teams.members.remove` | Remover membro do time | Gestores |
| `core.teams.members.manage` | Gerenciar membros | Admin |
| `core.teams.emails.link` | Vincular e-mail ao time | Gestores |
| `core.teams.emails.read` | Ler e-mails vinculados ao time | Membros |
| `core.teams.emails.manage` | Gerenciar e-mails do time | Admin |
| `core.teams.emails.unlink` | Desvincular e-mail do time | Gestores |

**Nota:** Endpoints da área Super Admin (`/v1/admin/*`) não utilizam o sistema de permissões RBAC por tenant. Eles usam exclusivamente o middleware `verifySuperAdmin`, que verifica o campo `isSuperAdmin` no payload do JWT.

---

## Data Model

Trecho relevante do `prisma/schema.prisma`:

```prisma
model User {
  id                          String    @id @default(uuid())
  username                    String?   @db.VarChar(32)
  email                       String    @db.VarChar(254)
  password_hash               String    @db.VarChar(100)
  failedLoginAttempts         Int       @default(0) @map("failed_login_attempts")
  blockedUntil                DateTime? @map("blocked_until")
  passwordResetToken          String?   @map("password_reset_token")
  passwordResetExpires        DateTime? @map("password_reset_expires")
  forcePasswordReset          Boolean   @default(false) @map("force_password_reset")
  forcePasswordResetReason    String?   @map("force_password_reset_reason") @db.VarChar(255)
  accessPinHash               String?   @map("access_pin_hash") @db.VarChar(100)
  actionPinHash               String?   @map("action_pin_hash") @db.VarChar(100)
  lastLoginAt                 DateTime? @map("last_login_at")
  deletedAt                   DateTime? @map("deleted_at")
  createdAt                   DateTime  @default(now()) @map("created_at")
  updatedAt                   DateTime  @updatedAt @map("updated_at")
  profile                     UserProfile?
  sessions                    Session[]
  refreshTokens               RefreshToken[]
  tenantUsers                 TenantUser[]
  @@map("users")
}

model Session {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  tenantId    String?   @map("tenant_id")
  ip          String    @db.VarChar(64)
  expiredAt   DateTime? @map("expired_at")
  revokedAt   DateTime? @map("revoked_at")
  userAgent   String?   @map("user_agent") @db.VarChar(512)
  deviceType  String?   @map("device_type") @db.VarChar(32)
  country     String?   @db.VarChar(64)
  createdAt   DateTime  @default(now()) @map("created_at")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([tenantId])
  @@map("sessions")
}

model Tenant {
  id        String           @id @default(uuid())
  name      String           @db.VarChar(128)
  slug      String           @unique @db.VarChar(128)
  status    TenantStatusEnum @default(ACTIVE)
  settings  Json             @default("{}")
  deletedAt DateTime?        @map("deleted_at")
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")
  @@map("tenants")
}

model Plan {
  id           String       @id @default(uuid())
  name         String       @unique @db.VarChar(64)
  tier         PlanTierEnum @default(FREE)
  price        Float        @default(0)
  isActive     Boolean      @default(true) @map("is_active")
  maxUsers     Int          @default(5) @map("max_users")
  maxProducts  Int          @default(100) @map("max_products")
  planModules  PlanModule[]
  tenantPlans  TenantPlan[]
  @@index([tier])
  @@index([isActive])
  @@map("plans")
}
```

---

## Tests

### Unit Tests

| Arquivo | Casos de Teste |
|---------|----------------|
| `use-cases/core/auth/authenticate-with-password.spec.ts` | Login com senha correta, falha com senha errada, bloqueio após MAX_ATTEMPTS, usuário deletado, reset forçado |
| `use-cases/core/auth/register-new-user.spec.ts` | Registro, e-mail duplicado, username duplicado, username gerado automaticamente |
| `use-cases/core/auth/send-password-reset-token.spec.ts` | Envio de token, usuário não encontrado, usuário deletado |
| `use-cases/core/auth/reset-password-by-token.spec.ts` | Reset com token válido, token expirado, token inválido |
| `use-cases/core/sessions/create-session.spec.ts` | Criação válida, persistência de refresh token, userId inválido, IP inválido, usuário deletado, múltiplas sessões |
| `use-cases/core/sessions/list-my-sessions.spec.ts` | Listagem de sessões próprias |
| `use-cases/core/sessions/logout-session.spec.ts` | Logout com revogação de refresh token, sessão já expirada |
| `use-cases/core/sessions/revoke-session.spec.ts` | Revogação administrativa de sessão |
| `use-cases/core/sessions/revoke-my-session.spec.ts` | Revogação própria, tentativa de revogar sessão de outro usuário |
| `use-cases/core/sessions/expire-session.spec.ts` | Expiração de sessão |
| `use-cases/core/sessions/list-all-active-sessions.spec.ts` | Listagem global de sessões ativas |
| `use-cases/core/sessions/list-user-sessions-by-date.spec.ts` | Filtro de sessões por data |
| `use-cases/core/me/*.spec.ts` | Alterar e-mail, senha, username, perfil; excluir conta; buscar dados |
| `use-cases/core/users/*.spec.ts` | CRUD de usuários, busca por e-mail/username/ID, listar online, force-password-reset |

**Total estimado:** ~90 testes unitários em 18+ arquivos.

**Factory principal:** `src/utils/tests/factories/core/make-user.ts` — cria usuário com repositório in-memory para testes isolados.

### E2E Tests

| Arquivo | Endpoint Coberto |
|---------|-----------------|
| `controllers/core/auth/v1-authenticate-with-password.e2e.spec.ts` | `POST /v1/auth/login/password` |
| `controllers/core/auth/v1-register-new-user.e2e.spec.ts` | `POST /v1/auth/register/password` |
| `controllers/core/auth/v1-send-password-reset-token.e2e.spec.ts` | `POST /v1/auth/password-reset/send` |
| `controllers/core/auth/v1-reset-password-by-token.e2e.spec.ts` | `POST /v1/auth/password-reset/reset` |
| `controllers/core/auth/v1-list-user-tenants.e2e.spec.ts` | `GET /v1/auth/tenants` |
| `controllers/core/auth/v1-select-tenant.e2e.spec.ts` | `POST /v1/auth/select-tenant` |
| `controllers/core/sessions/v1-list-my-sessions.e2e.spec.ts` | `GET /v1/sessions/me` |
| `controllers/core/sessions/v1-logout-session.e2e.spec.ts` | `POST /v1/sessions/logout` |
| `controllers/core/sessions/v1-refresh-session.e2e.spec.ts` | `POST /v1/sessions/refresh` |
| `controllers/core/sessions/v1-revoke-my-session.e2e.spec.ts` | `DELETE /v1/sessions/me/:id` |
| `controllers/core/sessions/v1-revoke-session.e2e.spec.ts` | `DELETE /v1/sessions/:id/revoke` |
| `controllers/core/sessions/v1-expire-session.e2e.spec.ts` | `DELETE /v1/sessions/:id/expire` |
| `controllers/core/sessions/v1-list-all-active-sessions.e2e.spec.ts` | `GET /v1/sessions` |
| `controllers/core/sessions/v1-list-user-sessions.e2e.spec.ts` | `GET /v1/sessions/user/:userId` |
| `controllers/core/sessions/v1-list-user-sessions-by-date.e2e.spec.ts` | `GET /v1/sessions/user/:userId/by-date` |
| `controllers/core/me/v1-get-my-user.e2e.spec.ts` | `GET /v1/me` |
| `controllers/core/me/v1-change-my-email.e2e.spec.ts` | `PATCH /v1/me/email` |
| `controllers/core/me/v1-change-my-password.e2e.spec.ts` | `PATCH /v1/me/password` |
| `controllers/core/me/v1-change-my-username.e2e.spec.ts` | `PATCH /v1/me/username` |
| `controllers/core/me/v1-change-my-profile.e2e.spec.ts` | `PATCH /v1/me/profile` |
| `controllers/core/me/v1-delete-my-user.e2e.spec.ts` | `DELETE /v1/me` |
| `controllers/core/users/v1-create-user.e2e.spec.ts` | `POST /v1/users` |
| `controllers/core/users/v1-get-user-by-id.e2e.spec.ts` | `GET /v1/users/:userId` |
| `controllers/core/users/v1-get-user-by-email.e2e.spec.ts` | `GET /v1/users/email/:email` |
| `controllers/core/users/v1-get-user-by-username.e2e.spec.ts` | `GET /v1/users/username/:username` |
| `controllers/core/users/v1-change-user-email.e2e.spec.ts` | `PATCH /v1/users/:userId/email` |
| `controllers/core/users/v1-change-user-password.e2e.spec.ts` | `PATCH /v1/users/:userId/password` |
| `controllers/core/users/v1-change-user-username.e2e.spec.ts` | `PATCH /v1/users/:userId/username` |
| `controllers/core/users/v1-change-user-profile.e2e.spec.ts` | `PATCH /v1/users/:userId/profile` |
| `controllers/core/users/v1-list-all-users.e2e.spec.ts` | `GET /v1/users` |
| `controllers/core/tenants/v1-create-tenant.e2e.spec.ts` | `POST /v1/tenants` |
| `controllers/core/tenants/v1-get-tenant.e2e.spec.ts` | `GET /v1/tenants/:id` |
| `controllers/core/tenants/v1-update-tenant.e2e.spec.ts` | `PATCH /v1/tenants/:id` |
| `controllers/core/tenants/v1-invite-user.e2e.spec.ts` | `POST /v1/tenants/:id/users/invite` |
| `controllers/core/tenants/v1-remove-user.e2e.spec.ts` | `DELETE /v1/tenants/:id/users/:userId` |
| `controllers/core/label-templates/v1-create-label-template.e2e.spec.ts` | `POST /v1/label-templates` |
| `controllers/core/label-templates/v1-list-label-templates.e2e.spec.ts` | `GET /v1/label-templates` |
| `controllers/core/label-templates/v1-get-label-template-by-id.e2e.spec.ts` | `GET /v1/label-templates/:id` |
| `controllers/core/label-templates/v1-update-label-template.e2e.spec.ts` | `PATCH /v1/label-templates/:id` |
| `controllers/core/label-templates/v1-delete-label-template.e2e.spec.ts` | `DELETE /v1/label-templates/:id` |
| `controllers/core/label-templates/v1-duplicate-label-template.e2e.spec.ts` | `POST /v1/label-templates/:id/duplicate` |
| `controllers/core/label-templates/v1-list-system-label-templates.e2e.spec.ts` | `GET /v1/label-templates/system` |
| `controllers/core/label-templates/v1-generate-label-template-thumbnail.e2e.spec.ts` | `POST /v1/label-templates/:id/thumbnail` |
| `controllers/admin/v1-list-tenants.e2e.spec.ts` | `GET /v1/admin/tenants` |
| `controllers/admin/v1-get-tenant-details.e2e.spec.ts` | `GET /v1/admin/tenants/:id` |
| `controllers/admin/v1-create-tenant.e2e.spec.ts` | `POST /v1/admin/tenants` |
| `controllers/admin/v1-update-tenant.e2e.spec.ts` | `PATCH /v1/admin/tenants/:id` |
| `controllers/admin/v1-delete-tenant.e2e.spec.ts` | `DELETE /v1/admin/tenants/:id` |
| `controllers/admin/v1-change-tenant-status.e2e.spec.ts` | `PUT /v1/admin/tenants/:id/status` |
| `controllers/admin/v1-change-tenant-plan.e2e.spec.ts` | `PUT /v1/admin/tenants/:id/plan` |
| `controllers/admin/v1-manage-feature-flags.e2e.spec.ts` | `PATCH /v1/admin/tenants/:id/feature-flags` |
| `controllers/admin/v1-list-tenant-users.e2e.spec.ts` | `GET /v1/admin/tenants/:id/users` |
| `controllers/admin/v1-create-tenant-user.e2e.spec.ts` | `POST /v1/admin/tenants/:id/users` |
| `controllers/admin/v1-remove-tenant-user.e2e.spec.ts` | `DELETE /v1/admin/tenants/:id/users/:userId` |
| `controllers/admin/v1-set-user-security-key.e2e.spec.ts` | `PUT /v1/admin/tenants/:id/users/:userId/security-key` |
| `controllers/admin/v1-list-plans.e2e.spec.ts` | `GET /v1/admin/plans` |
| `controllers/admin/v1-get-plan-by-id.e2e.spec.ts` | `GET /v1/admin/plans/:id` |
| `controllers/admin/v1-create-plan.e2e.spec.ts` | `POST /v1/admin/plans` |
| `controllers/admin/v1-update-plan.e2e.spec.ts` | `PUT /v1/admin/plans/:id` |
| `controllers/admin/v1-delete-plan.e2e.spec.ts` | `DELETE /v1/admin/plans/:id` |
| `controllers/admin/v1-set-plan-modules.e2e.spec.ts` | `PUT /v1/admin/plans/:id/modules` |
| `controllers/admin/v1-admin-dashboard.e2e.spec.ts` | `GET /v1/admin/dashboard` |

**Cenários-chave cobertos:**
- Isolamento multi-tenant (usuário A não acessa dados do tenant B)
- Rejeição de JWT sem tenantId em rotas com `verifyTenant`
- Rejeição de não-superadmin em rotas `/v1/admin/*`
- Criação de sessão e rotação de refresh token
- Bloqueio por força bruta e desbloqueio após login correto
- Templates de sistema imunes a edição/exclusão

**Factory utilitária para E2E:**
`src/utils/tests/factories/core/make-unique-email.ts` — gera e-mails únicos para evitar conflitos entre testes paralelos.

---

## Audit History

| Data | Dimensão | Pontuação | Relatório |
|------|----------|-----------|-----------|
| — | — | — | Nenhum registro. |
