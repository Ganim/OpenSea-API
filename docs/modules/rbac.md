# Module: RBAC (Role-Based Access Control)

## Overview

O módulo RBAC fornece controle de acesso baseado em papéis com granularidade de permissão individual. Ele governa o que cada usuário pode fazer dentro de um tenant, por meio de três mecanismos complementares:

1. **Grupos de permissão** — conjuntos nomeados de permissões atribuídos a usuários (equivalente a roles)
2. **Permissões diretas** — permissões atribuídas individualmente a um usuário, com suporte a efeito `allow`/`deny` e condições ABAC
3. **PermissionService** — serviço singleton com cache em três camadas (L1 in-memory, L2 Redis, L3 banco de dados) responsável pela verificação de cada acesso

O módulo é transversal ao sistema: todos os outros módulos o consultam via middleware `verifyPermission` para autorizar cada operação. Depende do módulo `core` (usuários, tenants) e é consumido pelo módulo `audit` (que registra alterações de permissão).

---

## Entities

### Permission

Representa uma permissão específica do sistema. Cada permissão é identificada por um código único no formato `module.resource.action[.scope]`.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | `UniqueEntityID` | Sim | UUID | Identificador único |
| `code` | `PermissionCode` | Sim | Value Object — 1 a 4 partes separadas por ponto | Código único da permissão |
| `name` | `string` | Sim | — | Nome legível |
| `description` | `string \| null` | Não | — | Descrição opcional |
| `module` | `string` | Sim | — | Módulo ao qual pertence (ex: `stock`) |
| `resource` | `string` | Sim | — | Recurso alvo (ex: `products`) |
| `action` | `string` | Sim | — | Ação permitida (ex: `create`) |
| `isSystem` | `boolean` | Não | Default `false` | Permissões de sistema não podem ser excluídas |
| `metadata` | `Record<string, unknown>` | Não | Default `{}` | Metadados livres |
| `createdAt` | `Date` | Não | Default `new Date()` | Data de criação |
| `updatedAt` | `Date` | Não | Default `new Date()` | Data da última atualização |

### PermissionGroup

Representa um grupo de permissões customizável — equivalente a uma role. Grupos suportam hierarquia via `parentId`: ao verificar as permissões de um usuário, o sistema percorre os grupos ancestrais e agrega todas as permissões herdadas.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | `UniqueEntityID` | Sim | UUID | Identificador único |
| `name` | `string` | Sim | — | Nome do grupo |
| `slug` | `string` | Sim | — | Identificador textual único |
| `description` | `string \| null` | Não | — | Descrição opcional |
| `isSystem` | `boolean` | Não | Default `false` | Grupos de sistema (admin, user) não podem ser excluídos |
| `isActive` | `boolean` | Não | Default `true` | Grupos inativos não concedem permissões |
| `color` | `string \| null` | Não | Hex color | Cor de exibição na interface |
| `priority` | `number` | Não | Default `0` | Prioridade para resolução de conflitos |
| `storageSettings` | `Record<string, unknown> \| null` | Não | — | Configurações de armazenamento opcionais |
| `parentId` | `UniqueEntityID \| null` | Não | — | ID do grupo pai (herança) |
| `tenantId` | `UniqueEntityID \| null` | Não | — | Tenant ao qual pertence (null = global) |
| `createdAt` | `Date` | Não | Default `new Date()` | Data de criação |
| `updatedAt` | `Date` | Não | Default `new Date()` | Data da última atualização |
| `deletedAt` | `Date \| null` | Não | — | Soft delete |

**Métodos de domínio:** `delete()`, `restore()`, `activate()`, `deactivate()`

### UserPermissionGroup

Representa a associação de um usuário a um grupo de permissões. Suporta expiração automática para acessos temporários.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | `UniqueEntityID` | Sim | UUID | Identificador único |
| `userId` | `UniqueEntityID` | Sim | — | Usuário |
| `groupId` | `UniqueEntityID` | Sim | — | Grupo de permissões |
| `expiresAt` | `Date \| null` | Não | — | Data de expiração (null = permanente) |
| `grantedBy` | `UniqueEntityID \| null` | Não | — | Quem concedeu o acesso |
| `createdAt` | `Date` | Não | Default `new Date()` | Data de criação |

**Getter computado:** `isExpired` — retorna `true` se `expiresAt` já passou.

### UserDirectPermission

Representa uma permissão atribuída diretamente a um usuário, sem passar por grupos. Permite controle granular individual, incluindo negação explícita (`deny`).

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | `UniqueEntityID` | Sim | UUID | Identificador único |
| `userId` | `UniqueEntityID` | Sim | — | Usuário |
| `permissionId` | `UniqueEntityID` | Sim | — | Permissão |
| `effect` | `'allow' \| 'deny'` | Não | Default `'allow'` | Efeito da permissão |
| `conditions` | `Record<string, unknown> \| null` | Não | — | Condições ABAC opcionais |
| `expiresAt` | `Date \| null` | Não | — | Data de expiração |
| `grantedBy` | `UniqueEntityID \| null` | Não | — | Quem concedeu |
| `createdAt` | `Date` | Não | Default `new Date()` | Data de criação |

### Value Objects

#### PermissionCode

Valida e estrutura o código de permissão.

- **Formatos aceitos:** `module` (1 parte), `module.resource` (2 partes), `module.resource.action` (3 partes), `module.resource.action.scope` (4 partes)
- **Wildcards:** o caractere `*` pode substituir qualquer segmento — ex: `stock.*.read`, `*.products.*`
- **Padrão válido:** `[a-z0-9*_-]+` por segmento (case-insensitive)
- **Método `matches(other)`:** compara dois códigos com suporte a wildcards

```typescript
// Exemplos de uso
PermissionCode.create('stock.products.create')  // válido
PermissionCode.create('stock.*.read')            // wildcard válido
PermissionCode.create('hr.employees.read.all')   // com escopo
PermissionCode.create('')                        // lança BadRequestError
```

#### PermissionEffect

Value Object que encapsula o efeito `allow` ou `deny`.

- **Regra de precedência:** `deny` tem sempre precedência sobre `allow` quando há conflito
- **Métodos estáticos:** `PermissionEffect.allow()`, `PermissionEffect.deny()`, `PermissionEffect.create(string)`

---

## Grupos Padrão do Sistema

O seed cria dois grupos de sistema (`isSystem: true`) que não podem ser excluídos:

| Slug | Prioridade | Cor | Descrição |
|------|-----------|-----|-----------|
| `admin` | 100 | `#DC2626` (vermelho) | Acesso total — todas as permissões |
| `user` | 10 | `#2563EB` (azul) | Acesso básico — apenas permissões `self.*` |

Grupos adicionais (ex: `gerente-estoque`, `vendedor`) são criados pelo administrador do tenant conforme a estrutura organizacional da empresa.

---

## PermissionService

O `PermissionService` é o núcleo do RBAC. É instanciado como **singleton** no processo para que o cache L1 seja efetivo entre requisições.

### Arquitetura de Cache (L1 → L2 → L3)

```
L1: Map<userId, { permissions, cachedAt, ttl }>   → in-memory, sub-milissegundo
L2: Redis (key: permissions:user:{userId})         → compartilhado entre processos, TTL 300s
L3: PostgreSQL                                     → fonte da verdade
```

A leitura percorre L1 → L2 → L3. A escrita popula L1 e L2 de forma assíncrona (write-back). A invalidação remove L1 imediatamente e envia `DEL` ao Redis de forma não-bloqueante.

### Algoritmo de Verificação

```typescript
// Fluxo de checkPermission(userId, permissionCode)
1. getUserPermissions(userId)          // busca com cache L1/L2/L3
2. findMatchingPermissions(code, map)  // wildcard matching
3. Se nenhum match → denied (No matching permissions found)
4. Se algum match tem effect='deny'  → denied (Explicit deny rule)
5. Se todos os matches têm effect='allow' → allowed
6. Registrar resultado em PermissionAuditLog (sempre)
```

### Herança de Grupos

Ao buscar permissões no banco (L3), o serviço:
1. Lista os grupos ativos do usuário (`listActiveByUserId`)
2. Para cada grupo, busca os ancestrais via `findAncestors(groupId)`
3. Agrega permissões de todos os grupos (incluindo pais) em um único `Map<code, effects[]>`

### Wildcard Matching

O matching é feito segmento a segmento (split por `.`). Os dois lados devem ter o mesmo número de segmentos para fazer match:

```
"stock.products.create" matches "stock.*.create"    ✓
"stock.products.create" matches "*.products.*"      ✓
"stock.products.create" matches "*.*.*"             ✓
"stock.products.create" matches "stock.products.*"  ✓
"stock.products.create" matches "sales.*.create"    ✗
```

---

## Middlewares

Localização: `src/http/middlewares/rbac/`

| Middleware | Função | Uso |
|-----------|--------|-----|
| `verifyJwt` | Valida o JWT e popula `request.user` | Todo endpoint autenticado |
| `verifyPermission(options)` | Cria middleware para verificação de permissão única | `preHandler: [verifyJwt, verifyPermission({permissionCode: '...'})]` |
| `createAnyPermissionMiddleware(codes[])` | Verifica se o usuário tem QUALQUER uma das permissões (OR) | Endpoints multi-nível |
| `createAllPermissionsMiddleware(codes[])` | Verifica se o usuário tem TODAS as permissões (AND) | Endpoints que exigem múltiplos acessos |
| `verifySuperAdmin` | Garante que o usuário é super admin | Rotas `/v1/admin/*` |
| `verifyTenant` | Garante que há um tenant selecionado no JWT | Rotas de tenant |

Exemplo de uso em um controller:

```typescript
app.post('/v1/rbac/permissions', {
  preHandler: [
    verifyJwt,
    createPermissionMiddleware({
      permissionCode: PermissionCodes.RBAC.PERMISSIONS.CREATE,
      resource: 'permissions',
    }),
  ],
  handler: async (request, reply) => { ... },
});
```

---

## Endpoints

### Permissions (`/v1/rbac/permissions`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/rbac/permissions` | `rbac.permissions.create` | Cria uma nova permissão |
| `GET` | `/v1/rbac/permissions` | `rbac.permissions.list` | Lista permissões com paginação |
| `GET` | `/v1/rbac/permissions/all` | `rbac.permissions.list` | Lista todas as permissões sem paginação |
| `GET` | `/v1/rbac/permissions/modules` | `rbac.permissions.list` | Lista permissões agrupadas por módulo |
| `GET` | `/v1/rbac/permissions/:id` | `rbac.permissions.read` | Busca permissão por ID |
| `GET` | `/v1/rbac/permissions/code/:code` | `rbac.permissions.read` | Busca permissão por código |
| `PUT` | `/v1/rbac/permissions/:id` | `rbac.permissions.update` | Atualiza permissão |
| `DELETE` | `/v1/rbac/permissions/:id` | `rbac.permissions.delete` | Exclui permissão |

### Permission Groups (`/v1/rbac/permission-groups`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/rbac/permission-groups` | `rbac.groups.create` | Cria um grupo de permissões |
| `GET` | `/v1/rbac/permission-groups` | `rbac.groups.list` | Lista grupos com paginação |
| `GET` | `/v1/rbac/permission-groups/:id` | `rbac.groups.read` | Busca grupo por ID |
| `PUT` | `/v1/rbac/permission-groups/:id` | `rbac.groups.update` | Atualiza grupo |
| `DELETE` | `/v1/rbac/permission-groups/:id` | `rbac.groups.delete` | Exclui grupo (soft delete) |

### Associations (`/v1/rbac/associations`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/rbac/associations/groups/:groupId/permissions` | `rbac.groups.manage` | Adiciona permissão a um grupo |
| `POST` | `/v1/rbac/associations/groups/:groupId/permissions/bulk` | `rbac.groups.manage` | Adiciona múltiplas permissões a um grupo |
| `DELETE` | `/v1/rbac/associations/groups/:groupId/permissions/:permissionId` | `rbac.groups.manage` | Remove permissão de um grupo |
| `POST` | `/v1/rbac/associations/users/:userId/groups` | `rbac.users.assign-group` | Atribui grupo a um usuário |
| `DELETE` | `/v1/rbac/associations/users/:userId/groups/:groupId` | `rbac.users.assign-group` | Remove grupo de um usuário |
| `GET` | `/v1/rbac/associations/groups/:groupId/permissions` | `rbac.groups.read` | Lista permissões de um grupo |
| `GET` | `/v1/rbac/associations/groups/:groupId/users` | `rbac.groups.read` | Lista usuários de um grupo |
| `GET` | `/v1/rbac/associations/users/:userId/groups` | `rbac.users.read` | Lista grupos de um usuário |
| `GET` | `/v1/rbac/associations/users/:userId/permissions` | `rbac.users.read` | Lista permissões efetivas de um usuário |

### User Direct Permissions (`/v1/rbac/users`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/rbac/users/:userId/permissions` | `rbac.users.grant-permission` | Concede permissão direta |
| `DELETE` | `/v1/rbac/users/:userId/permissions/:permissionId` | `rbac.users.grant-permission` | Revoga permissão direta |
| `PUT` | `/v1/rbac/users/:userId/permissions/:permissionId` | `rbac.users.grant-permission` | Atualiza permissão direta (efeito/expiração) |
| `GET` | `/v1/rbac/users/:userId/permissions/direct` | `rbac.users.read` | Lista permissões diretas de um usuário |
| `GET` | `/v1/rbac/users/by-permission/:permissionCode` | `rbac.permissions.read` | Lista usuários com uma permissão específica |

### Request/Response Examples

**Criar permissão:**

```http
POST /v1/rbac/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "finance.reports.export",
  "name": "Exportar Relatórios Financeiros",
  "description": "Permite exportar relatórios do módulo financeiro",
  "module": "finance",
  "resource": "reports",
  "action": "export"
}
```

**Atribuir grupo a usuário:**

```http
POST /v1/rbac/associations/users/{userId}/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupId": "uuid-do-grupo",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Conceder permissão direta com negação:**

```http
POST /v1/rbac/users/{userId}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissionId": "uuid-da-permissao",
  "effect": "deny",
  "expiresAt": null
}
```

---

## Business Rules

### Regra 1: Precedência de Deny

`deny` tem sempre precedência sobre `allow`, independentemente de onde a permissão foi concedida (grupo ou direta). Se um usuário pertence a dois grupos — um com `allow` e outro com `deny` para a mesma permissão — o acesso é negado.

### Regra 2: Herança de Grupos

Quando um grupo possui um `parentId`, o usuário herda automaticamente todas as permissões do grupo pai e de todos os ancestrais na hierarquia. A herança é resolvida no momento da busca no banco de dados (L3).

### Regra 3: Grupos de Sistema são Imutáveis

Grupos com `isSystem: true` (slugs `admin` e `user`) não podem ser excluídos via API. Tentativas retornam erro de validação.

### Regra 4: Permissões de Sistema são Imutáveis

Permissões com `isSystem: true` não podem ser excluídas. Elas são criadas durante o seed e representam contratos do sistema.

### Regra 5: Expiração Automática

Atribuições de grupo (`UserPermissionGroup`) e permissões diretas (`UserDirectPermission`) suportam data de expiração. O getter `isExpired` é verificado durante a busca de permissões ativas no repositório (`listActiveByUserId`).

### Regra 6: Cache e Invalidação

Após qualquer alteração no RBAC de um usuário (atribuição/remoção de grupo, grant/revoke de permissão direta), o cache do usuário afetado deve ser invalidado via `permissionService.invalidateUserCache(userId)`. Caso contrário, as mudanças só terão efeito após o TTL do cache (5 minutos L1, 300s L2).

### Regra 7: Wildcard Matching

Permissões com wildcard no código (ex: `stock.*.*`) cobrem todas as permissões que se enquadram no padrão. O matching exige que os dois códigos tenham o mesmo número de segmentos separados por ponto.

---

## Permissions

As permissões do próprio módulo RBAC (para gerenciar o RBAC) são:

| Code | Description |
|------|-------------|
| `rbac.permissions.create` | Criar permissões |
| `rbac.permissions.read` | Visualizar permissão individual |
| `rbac.permissions.list` | Listar permissões |
| `rbac.permissions.update` | Atualizar permissões |
| `rbac.permissions.delete` | Excluir permissões |
| `rbac.groups.create` | Criar grupos de permissão |
| `rbac.groups.read` | Visualizar grupo |
| `rbac.groups.list` | Listar grupos |
| `rbac.groups.update` | Atualizar grupos |
| `rbac.groups.delete` | Excluir grupos |
| `rbac.groups.manage` | Gerenciar permissões dentro de grupos |
| `rbac.users.read` | Visualizar permissões/grupos de um usuário |
| `rbac.users.assign-group` | Atribuir/remover grupos de usuários |
| `rbac.users.grant-permission` | Conceder/revogar permissões diretas |
| `self.permissions.read` | Ver própria permissão |
| `self.permissions.list` | Listar próprias permissões |
| `self.groups.read` | Ver próprio grupo |
| `self.groups.list` | Listar próprios grupos |

---

## Data Model

Modelos Prisma relevantes (extraído de `prisma/schema.prisma`):

```prisma
model Permission {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  module      String
  resource    String
  action      String
  isSystem    Boolean  @default(false) @map("is_system")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  permissionGroupPermissions PermissionGroupPermission[]
  userDirectPermissions      UserDirectPermission[]
  permissionAuditLogs        PermissionAuditLog[]

  @@map("permissions")
}

model PermissionGroup {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  description     String?
  isSystem        Boolean   @default(false) @map("is_system")
  isActive        Boolean   @default(true)  @map("is_active")
  color           String?
  priority        Int       @default(0)
  storageSettings Json?     @map("storage_settings")
  parentId        String?   @map("parent_id")
  tenantId        String?   @map("tenant_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  parent      PermissionGroup?            @relation("GroupHierarchy", fields: [parentId], references: [id])
  children    PermissionGroup[]           @relation("GroupHierarchy")
  permissions PermissionGroupPermission[]
  users       UserPermissionGroup[]

  @@map("permission_groups")
}

model UserPermissionGroup {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  groupId   String    @map("group_id")
  expiresAt DateTime? @map("expires_at")
  grantedBy String?   @map("granted_by")
  createdAt DateTime  @default(now()) @map("created_at")

  user  User            @relation(fields: [userId], references: [id])
  group PermissionGroup @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
  @@map("user_permission_groups")
}

model UserDirectPermission {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  permissionId String    @map("permission_id")
  effect       String    @default("allow")
  conditions   Json?
  expiresAt    DateTime? @map("expires_at")
  grantedBy    String?   @map("granted_by")
  createdAt    DateTime  @default(now()) @map("created_at")

  user       User       @relation(fields: [userId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])

  @@unique([userId, permissionId])
  @@map("user_direct_permissions")
}
```

---

## Use Cases

### permissions/
| Use Case | Descrição |
|----------|-----------|
| `CreatePermissionUseCase` | Cria nova permissão; valida que o código seja único |
| `GetPermissionByIdUseCase` | Busca permissão por UUID |
| `GetPermissionByCodeUseCase` | Busca permissão por código string |
| `ListPermissionsUseCase` | Lista paginada com filtros |
| `ListAllPermissionsUseCase` | Lista completa sem paginação |
| `ListPermissionsByModulesUseCase` | Agrupa permissões por módulo |
| `UpdatePermissionUseCase` | Atualiza name, description, metadata |
| `DeletePermissionUseCase` | Exclui permissão (proibido se `isSystem`) |

### permission-groups/
| Use Case | Descrição |
|----------|-----------|
| `CreatePermissionGroupUseCase` | Cria grupo; gera slug único |
| `GetPermissionGroupByIdUseCase` | Busca grupo por ID |
| `ListPermissionGroupsUseCase` | Lista paginada com filtros |
| `UpdatePermissionGroupUseCase` | Atualiza atributos do grupo |
| `DeletePermissionGroupUseCase` | Soft delete (proibido se `isSystem`) |

### associations/
| Use Case | Descrição |
|----------|-----------|
| `AddPermissionToGroupUseCase` | Associa permissão a grupo com efeito |
| `BulkAddPermissionsToGroupUseCase` | Associação em lote |
| `RemovePermissionFromGroupUseCase` | Remove associação permissão-grupo |
| `AssignGroupToUserUseCase` | Atribui grupo a usuário (com expiração opcional) |
| `RemoveGroupFromUserUseCase` | Remove grupo de usuário |
| `ListGroupPermissionsUseCase` | Lista permissões de um grupo |
| `ListUserGroupsUseCase` | Lista grupos de um usuário |
| `ListUserPermissionsUseCase` | Lista permissões efetivas de um usuário |
| `ListUsersByGroupUseCase` | Lista usuários de um grupo |

### user-direct-permissions/
| Use Case | Descrição |
|----------|-----------|
| `GrantDirectPermissionUseCase` | Concede permissão direta (allow/deny) |
| `RevokeDirectPermissionUseCase` | Revoga permissão direta |
| `UpdateDirectPermissionUseCase` | Atualiza efeito, condições ou expiração |
| `ListUserDirectPermissionsUseCase` | Lista permissões diretas de um usuário |
| `ListUsersByPermissionUseCase` | Lista usuários com determinada permissão |

---

## Tests

- **Testes unitários:** 19 arquivos `.spec.ts` nos use cases e value objects
- **Testes E2E:** 15 arquivos `.e2e.spec.ts` nos controllers
- **Testes de serviço:** `src/services/rbac/permission-service.spec.ts`

Cenários-chave cobertos:
- Criação de permissão com código duplicado (deve falhar)
- Exclusão de permissão de sistema (deve falhar)
- Wildcard matching em todos os formatos (1, 2, 3 e 4 partes)
- Precedência deny > allow com múltiplos grupos
- Expiração de `UserPermissionGroup` e `UserDirectPermission`
- Herança de permissões por hierarquia de grupos
- Cache L1/L2 com invalidação
- Bulk add de permissões a grupo
- Isolamento multi-tenant

Factories de teste:
- `src/utils/tests/factories/` — helpers para criar usuário autenticado com permissões RBAC nos testes E2E via `create-and-authenticate-user.e2e.ts`

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Documentação inicial | — | Este arquivo |
