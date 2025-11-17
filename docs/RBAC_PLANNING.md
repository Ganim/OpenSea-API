# 🔐 Planejamento: Sistema RBAC Granular e Dinâmico

**Data de Criação:** 17 de novembro de 2025  
**Status:** 📋 Planejamento  
**Objetivo:** Implementar um sistema RBAC (Role-Based Access Control) granular, dinâmico e customizável

---

## 📋 Índice

1. [Análise da Situação Atual](#-análise-da-situação-atual)
2. [Requisitos do Novo Sistema](#-requisitos-do-novo-sistema)
3. [Arquitetura Proposta](#-arquitetura-proposta)
4. [Schema do Banco de Dados](#-schema-do-banco-de-dados)
5. [Estrutura de Domínio (DDD)](#-estrutura-de-domínio-ddd)
6. [Implementação por Camadas](#-implementação-por-camadas)
7. [Plano de Migração](#-plano-de-migração)
8. [Testes](#-testes)
9. [Roadmap de Implementação](#-roadmap-de-implementação)

---

## 🔍 Análise da Situação Atual

### Sistema Atual (Role-Based Simples)

**Schema Prisma:**
```prisma
enum Role {
  ADMIN    // Acesso total
  MANAGER  // Criação e edição
  USER     // Consultas básicas
}

model User {
  role Role @default(USER)
}
```

**Middlewares:**
- `verifyJwt` - Verifica se usuário está autenticado
- `verifyUserManager` - Verifica se é MANAGER ou ADMIN
- `verifyUserAdmin` - Verifica se é ADMIN

**Verificação de Permissões:**
```typescript
// Exemplo atual em middlewares
if (!Role.checkRole(role, 'ADMIN')) {
  throw new ForbiddenError('Only ADMIN can perform this action');
}
```

### ❌ Limitações Identificadas

1. **Roles Fixas:** Apenas 3 níveis (USER, MANAGER, ADMIN)
2. **Sem Granularidade:** Não há permissões específicas por módulo/recurso
3. **Não Customizável:** Impossível criar perfis personalizados
4. **Hard-coded:** Permissões definidas diretamente no código
5. **Sem Hierarquia Complexa:** Não suporta herança de permissões
6. **Sem Contexto:** Não considera ownership (ex: editar próprio recurso)
7. **Sem Audit Trail:** Difícil rastrear quem tem acesso ao quê

---

## 🎯 Requisitos do Novo Sistema

### Requisitos Funcionais

#### RF01 - Permissões Granulares
- ✅ Permissões específicas por recurso (ex: `products.create`, `variants.update`)
- ✅ Permissões por módulo (Core, Stock, Sales)
- ✅ Suporte a wildcards (ex: `products.*`, `*.read`)

#### RF02 - Grupos de Permissões (Roles Customizadas)
- ✅ Criar grupos de permissões personalizados
- ✅ Atribuir múltiplas permissões a um grupo
- ✅ Vincular usuários a múltiplos grupos

#### RF03 - Hierarquia de Permissões
- ✅ Herança de permissões entre grupos
- ✅ Sistema de precedência (deny > allow)

#### RF04 - Permissões Contextuais
- ✅ Verificar ownership (ex: usuário pode editar seus próprios recursos)
- ✅ Permissões baseadas em atributos (ABAC - Attribute-Based Access Control)

#### RF05 - Gerenciamento Dinâmico
- ✅ CRUD de grupos de permissões via API
- ✅ CRUD de permissões via API
- ✅ Atribuição de grupos a usuários via API

#### RF06 - Auditoria
- ✅ Registro de todas as verificações de permissão
- ✅ Histórico de mudanças em grupos e permissões

### Requisitos Não-Funcionais

#### RNF01 - Performance
- ✅ Cache de permissões em memória (Redis)
- ✅ Consultas otimizadas (índices adequados)
- ✅ Lazy loading de permissões

#### RNF02 - Segurança
- ✅ Princípio do menor privilégio
- ✅ Deny por padrão
- ✅ Validação rigorosa de permissões

#### RNF03 - Escalabilidade
- ✅ Suporte a milhares de permissões
- ✅ Suporte a centenas de grupos

#### RNF04 - Manutenibilidade
- ✅ Código seguindo Clean Code, SOLID, DDD
- ✅ Testes unitários e E2E completos
- ✅ Documentação clara

---

## 🏗️ Arquitetura Proposta

### Conceitos Principais

```
┌─────────────────────────────────────────────────────────────┐
│                         RBAC System                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User ──→ UserPermissionGroup ──→ PermissionGroup           │
│                                         │                     │
│                                         ↓                     │
│                              PermissionGroupPermission        │
│                                         │                     │
│                                         ↓                     │
│                                   Permission                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Permissões

**Formato de Permissão:**
```
<módulo>.<recurso>.<ação>

Exemplos:
- core.users.create
- stock.products.update
- sales.orders.delete
- stock.*.read          (wildcard: todas as operações de leitura no stock)
- *.variants.*          (wildcard: todas as operações em variants)
- *.*.*                 (wildcard: super admin)
```

**Módulos:**
- `core` - Autenticação, usuários, sessões
- `stock` - Produtos, variantes, itens, estoque
- `sales` - Clientes, pedidos, promoções

**Recursos (exemplos):**
- `users`, `sessions`, `profiles`
- `products`, `variants`, `items`, `suppliers`, `manufacturers`
- `customers`, `orders`, `promotions`

**Ações Padrão:**
- `create` - Criar novo recurso
- `read` - Ler/visualizar recurso
- `update` - Atualizar recurso
- `delete` - Deletar recurso
- `list` - Listar recursos
- `manage` - Gerenciar (todas as operações)

**Ações Especiais:**
- `request` - Abrir solicitações dentro de um módulo (ex: solicitar criação, alteração)
- `read_own` - Ler apenas próprios recursos
- `update_own` - Atualizar apenas próprios recursos
- `delete_own` - Deletar apenas próprios recursos
- `approve` - Aprovar operações (aprovar solicitações abertas)
- `export` - Exportar dados
- `import` - Importar dados

---

## 📊 Schema do Banco de Dados

### Nova Estrutura Prisma

```prisma
// ===============================================
// RBAC MODULE
// ===============================================

/// Representa uma permissão específica no sistema
model Permission {
  id          String   @id @default(uuid())
  
  // Identificador único da permissão (ex: core.users.create)
  code        String   @unique @db.VarChar(128)
  
  // Nome legível da permissão
  name        String   @db.VarChar(128)
  
  // Descrição detalhada do que a permissão permite
  description String?  @db.Text
  
  // Módulo ao qual a permissão pertence
  module      String   @db.VarChar(64)  // core, stock, sales
  
  // Recurso ao qual a permissão se aplica
  resource    String   @db.VarChar(64)  // users, products, orders
  
  // Ação permitida
  action      String   @db.VarChar(64)  // create, read, update, delete
  
  // Se é uma permissão do sistema (não pode ser deletada)
  isSystem    Boolean  @default(false) @map("is_system")
  
  // Metadados adicionais (para ABAC futuramente)
  metadata    Json     @default("{}")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relations
  permissionGroups PermissionGroupPermission[]
  
  @@index([module, resource, action])
  @@index([code])
  @@index([module])
  @@map("permissions")
}

/// Grupo de permissões (equivalente a uma Role customizável)
model PermissionGroup {
  id          String   @id @default(uuid())
  
  // Nome do grupo (ex: "Gerente de Estoque", "Vendedor")
  name        String   @unique @db.VarChar(128)
  
  // Slug para uso programático
  slug        String   @unique @db.VarChar(128)
  
  // Descrição do grupo
  description String?  @db.Text
  
  // Se é um grupo do sistema (não pode ser deletado)
  isSystem    Boolean  @default(false) @map("is_system")
  
  // Se o grupo está ativo
  isActive    Boolean  @default(true) @map("is_active")
  
  // Cor para UI (opcional)
  color       String?  @db.VarChar(7)  // hex color
  
  // Prioridade (para resolver conflitos)
  priority    Int      @default(0)
  
  // Grupo pai (para herança)
  parentId    String?  @map("parent_id")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  // Relations
  parent               PermissionGroup?            @relation("GroupHierarchy", fields: [parentId], references: [id])
  children             PermissionGroup[]           @relation("GroupHierarchy")
  permissions          PermissionGroupPermission[]
  users                UserPermissionGroup[]
  
  @@index([slug])
  @@index([isActive])
  @@index([parentId])
  @@map("permission_groups")
}

/// Relacionamento entre Grupos e Permissões
model PermissionGroupPermission {
  id          String   @id @default(uuid())
  
  groupId     String   @map("group_id")
  permissionId String  @map("permission_id")
  
  // Tipo de acesso (allow ou deny)
  // Deny tem precedência sobre allow
  effect      String   @default("allow") @db.VarChar(10)  // allow, deny
  
  // Condições para aplicar a permissão (JSON com regras ABAC)
  conditions  Json?    @default("{}")
  
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  group       PermissionGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  permission  Permission      @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([groupId, permissionId])
  @@index([groupId])
  @@index([permissionId])
  @@map("permission_group_permissions")
}

/// Relacionamento entre Usuários e Grupos de Permissões
model UserPermissionGroup {
  id          String   @id @default(uuid())
  
  userId      String   @map("user_id")
  groupId     String   @map("group_id")
  
  // Data de expiração (opcional, para acesso temporário)
  expiresAt   DateTime? @map("expires_at")
  
  // Quem concedeu o acesso
  grantedBy   String?  @map("granted_by")
  
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  group       PermissionGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  granter     User?           @relation("GrantedPermissions", fields: [grantedBy], references: [id])
  
  @@unique([userId, groupId])
  @@index([userId])
  @@index([groupId])
  @@index([expiresAt])
  @@map("user_permission_groups")
}

/// Log de verificações de permissão (auditoria)
model PermissionAuditLog {
  id           String   @id @default(uuid())
  
  userId       String   @map("user_id")
  permissionCode String @map("permission_code") @db.VarChar(128)
  
  // Resultado da verificação
  allowed      Boolean
  
  // Motivo (qual regra permitiu/negou)
  reason       String?  @db.VarChar(512)
  
  // Contexto da requisição
  resource     String?  @db.VarChar(64)
  resourceId   String?  @map("resource_id")
  action       String?  @db.VarChar(64)
  
  // Metadados da requisição
  ip           String?  @db.VarChar(64)
  userAgent    String?  @map("user_agent") @db.VarChar(512)
  endpoint     String?  @db.VarChar(256)
  
  createdAt    DateTime @default(now()) @map("created_at")
  
  // Relations
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([permissionCode])
  @@index([allowed])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@map("permission_audit_logs")
}
```

### Atualização no User Model

```prisma
model User {
  // ... campos existentes ...
  
  // Remover ou manter role como fallback
  role Role @default(USER)  // Manter para retrocompatibilidade
  
  // Adicionar relations
  permissionGroups        UserPermissionGroup[]
  grantedPermissions      UserPermissionGroup[]    @relation("GrantedPermissions")
  permissionAuditLogs     PermissionAuditLog[]
}
```

---

## 🎨 Estrutura de Domínio (DDD)

### Entidades de Domínio

```
src/entities/rbac/
├── permission.ts                    # Entidade Permission
├── permission-group.ts              # Entidade PermissionGroup
├── user-permission-group.ts         # Entidade UserPermissionGroup
├── permission-group-permission.ts   # Entidade PermissionGroupPermission
├── permission-audit-log.ts          # Entidade PermissionAuditLog
└── value-objects/
    ├── permission-code.ts           # Value Object para código de permissão
    ├── permission-effect.ts         # Value Object para allow/deny
    ├── permission-module.ts         # Value Object para módulo
    └── permission-metadata.ts       # Value Object para metadados
```

### Value Objects Principais

#### PermissionCode
```typescript
// Formato: module.resource.action
// Exemplos: core.users.create, stock.*.read

class PermissionCode {
  private readonly _value: string;
  private readonly _module: string;
  private readonly _resource: string;
  private readonly _action: string;
  private readonly _isWildcard: boolean;
  
  static create(value: string): PermissionCode
  static createFromParts(module: string, resource: string, action: string): PermissionCode
  
  matches(other: PermissionCode): boolean  // Suporta wildcards
  get module(): string
  get resource(): string
  get action(): string
  get value(): string
  get isWildcard(): boolean
}
```

#### PermissionEffect
```typescript
// allow ou deny
class PermissionEffect {
  private readonly _value: 'allow' | 'deny';
  
  static allow(): PermissionEffect
  static deny(): PermissionEffect
  
  get isAllow(): boolean
  get isDeny(): boolean
  get value(): string
}
```

---

## 🔨 Implementação por Camadas

### 1. Camada de Repositórios

```
src/repositories/rbac/
├── permissions-repository.ts                # Interface
├── permission-groups-repository.ts          # Interface
├── user-permission-groups-repository.ts     # Interface
├── permission-audit-logs-repository.ts      # Interface
├── prisma/
│   ├── prisma-permissions-repository.ts
│   ├── prisma-permission-groups-repository.ts
│   ├── prisma-user-permission-groups-repository.ts
│   └── prisma-permission-audit-logs-repository.ts
└── in-memory/
    ├── in-memory-permissions-repository.ts
    ├── in-memory-permission-groups-repository.ts
    ├── in-memory-user-permission-groups-repository.ts
    └── in-memory-permission-audit-logs-repository.ts
```

### 2. Camada de Use Cases

```
src/use-cases/rbac/
├── permissions/
│   ├── create-permission.ts
│   ├── create-permission.spec.ts
│   ├── list-permissions.ts
│   ├── get-permission-by-code.ts
│   ├── update-permission.ts
│   ├── delete-permission.ts
│   └── factories/
├── permission-groups/
│   ├── create-permission-group.ts
│   ├── create-permission-group.spec.ts
│   ├── list-permission-groups.ts
│   ├── get-permission-group.ts
│   ├── update-permission-group.ts
│   ├── delete-permission-group.ts
│   ├── add-permission-to-group.ts
│   ├── remove-permission-from-group.ts
│   └── factories/
├── user-permissions/
│   ├── assign-group-to-user.ts
│   ├── assign-group-to-user.spec.ts
│   ├── remove-group-from-user.ts
│   ├── list-user-permissions.ts
│   ├── check-user-permission.ts         # ⭐ Core use case
│   ├── check-user-permission.spec.ts
│   └── factories/
└── audit/
    ├── log-permission-check.ts
    └── list-permission-audit-logs.ts
```

### 3. Serviço de Permissões (Core)

```typescript
// src/services/permission-service.ts

export interface PermissionCheckContext {
  userId: string;
  permissionCode: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  matchedPermissions: Permission[];
  deniedBy?: Permission;
}

export class PermissionService {
  constructor(
    private permissionsRepository: PermissionsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private cache: CacheService,
    private auditLogger: PermissionAuditLogger,
  ) {}

  /**
   * Verifica se o usuário tem uma permissão específica
   * 
   * Algoritmo:
   * 1. Buscar todos os grupos do usuário
   * 2. Buscar todas as permissões dos grupos (com herança)
   * 3. Verificar wildcards e matches
   * 4. Aplicar precedência (deny > allow)
   * 5. Verificar condições ABAC se existirem
   * 6. Registrar auditoria
   */
  async checkPermission(context: PermissionCheckContext): Promise<PermissionCheckResult>
  
  /**
   * Busca todas as permissões de um usuário (com cache)
   */
  async getUserPermissions(userId: string): Promise<Permission[]>
  
  /**
   * Limpa cache de permissões de um usuário
   */
  async invalidateUserPermissionsCache(userId: string): Promise<void>
  
  /**
   * Verifica múltiplas permissões de uma vez
   */
  async checkMultiplePermissions(
    userId: string,
    permissionCodes: string[],
  ): Promise<Map<string, boolean>>
}
```

### 4. Middlewares

```
src/http/middlewares/
├── verify-permission.ts          # ⭐ Novo middleware principal
├── verify-permission-factory.ts  # Factory para criar middlewares específicos
├── verify-jwt.ts                 # Manter existente
└── legacy/                       # Deprecar gradualmente
    ├── verify-user-admin.ts
    └── verify-user-manager.ts
```

**Novo Middleware:**
```typescript
// verify-permission.ts
export function verifyPermission(permissionCode: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    
    const permissionService = makePermissionService();
    
    const result = await permissionService.checkPermission({
      userId,
      permissionCode,
      resourceId: request.params.id,
      metadata: {
        method: request.method,
        url: request.url,
        ip: request.ip,
      },
    });
    
    if (!result.allowed) {
      throw new ForbiddenError(
        `You don't have permission to ${permissionCode}`,
      );
    }
  };
}

// Uso nos controllers:
app.route({
  method: 'POST',
  url: '/v1/products',
  preHandler: [verifyJwt, verifyPermission('stock.products.create')],
  handler: async (request, reply) => { ... }
})
```

### 5. Controllers (API)

```
src/http/controllers/rbac/
├── permissions/
│   ├── routes.ts
│   ├── v1-create-permission.controller.ts
│   ├── v1-list-permissions.controller.ts
│   ├── v1-get-permission.controller.ts
│   ├── v1-update-permission.controller.ts
│   └── v1-delete-permission.controller.ts
├── permission-groups/
│   ├── routes.ts
│   ├── v1-create-group.controller.ts
│   ├── v1-list-groups.controller.ts
│   ├── v1-get-group.controller.ts
│   ├── v1-update-group.controller.ts
│   ├── v1-delete-group.controller.ts
│   ├── v1-add-permission-to-group.controller.ts
│   └── v1-remove-permission-from-group.controller.ts
└── user-permissions/
    ├── routes.ts
    ├── v1-assign-group-to-user.controller.ts
    ├── v1-remove-group-from-user.controller.ts
    ├── v1-list-user-groups.controller.ts
    ├── v1-list-user-permissions.controller.ts
    └── v1-check-permission.controller.ts
```

### 6. Schemas

```
src/http/schemas/
└── rbac.schema.ts
```

---

## 🚀 Plano de Migração

### Fase 1: Preparação (Retrocompatibilidade)

1. **Criar tabelas novas sem remover as antigas**
   - Adicionar novas tabelas RBAC ao schema Prisma
   - Manter campo `role` em User por enquanto

2. **Seed inicial de permissões**
   - Criar permissões básicas para todos os recursos existentes
   - Criar grupos equivalentes às roles atuais:
     - `admin-group` → todas as permissões
     - `manager-group` → permissões de criação/edição
     - `user-group` → permissões de leitura

3. **Migrar usuários existentes**
   - Script de migração que atribui grupos baseado no role atual
   - Manter role sincronizado durante transição

### Fase 2: Implementação Paralela

1. **Implementar sistema RBAC completo**
   - Entidades de domínio
   - Repositórios
   - Use cases
   - Serviço de permissões
   - Novos middlewares

2. **API de gerenciamento**
   - Controllers RBAC
   - Schemas
   - Testes E2E

3. **Testes**
   - Unitários para todas as camadas
   - E2E para fluxos completos
   - Performance tests

### Fase 3: Migração Gradual

1. **Atualizar controllers gradualmente**
   - Começar por módulos menos críticos (tags, categorias)
   - Substituir `verifyUserManager` por `verifyPermission('stock.tags.create')`
   - Manter backwards compatibility

2. **Monitoramento**
   - Logs de auditoria
   - Métricas de performance
   - Alertas para falhas

### Fase 4: Deprecação

1. **Remover código legacy**
   - Deprecar middlewares antigos
   - Remover campo `role` do User (ou manter apenas como label)
   - Limpar código não utilizado

---

## 🧪 Testes

### Estratégia de Testes

#### Testes Unitários

1. **Value Objects**
   ```typescript
   describe('PermissionCode', () => {
     it('should create valid permission code')
     it('should validate format')
     it('should match wildcards')
     it('should parse module, resource, action')
   })
   ```

2. **Entidades**
   ```typescript
   describe('PermissionGroup', () => {
     it('should create permission group')
     it('should inherit from parent')
     it('should check if user has permission')
   })
   ```

3. **Use Cases**
   ```typescript
   describe('CheckUserPermission', () => {
     it('should allow when user has direct permission')
     it('should allow when user has wildcard permission')
     it('should deny when permission is explicitly denied')
     it('should deny takes precedence over allow')
     it('should check with inheritance')
     it('should validate expired group membership')
   })
   ```

4. **Permission Service**
   ```typescript
   describe('PermissionService', () => {
     it('should cache user permissions')
     it('should invalidate cache on permission change')
     it('should handle wildcards correctly')
     it('should apply deny precedence')
   })
   ```

#### Testes de Integração

1. **Repositories**
   - Testar queries complexas
   - Testar transações
   - Testar índices

2. **Use Cases com Banco**
   - Fluxos completos
   - Edge cases
   - Concorrência

#### Testes E2E

1. **Fluxos de Permissão**
   ```typescript
   describe('RBAC E2E', () => {
     it('admin can create permission group')
     it('manager can assign group to user')
     it('user with permission can access resource')
     it('user without permission receives 403')
     it('permission changes reflect immediately')
   })
   ```

2. **Migração de Controllers**
   - Testar cada endpoint com novo sistema
   - Garantir mesmo comportamento

---

## 📅 Roadmap de Implementação

### Sprint 1: Fundação (5 dias)
- [ ] Criar schema Prisma RBAC
- [ ] Migração do banco de dados
- [ ] Seed de permissões iniciais
- [ ] Value Objects (PermissionCode, PermissionEffect)
- [ ] Entidades de domínio básicas

### Sprint 2: Repositórios (3 dias)
- [ ] Interfaces de repositórios
- [ ] Implementação Prisma
- [ ] Implementação In-Memory
- [ ] Testes unitários de repositórios

### Sprint 3: Core Logic (5 dias)
- [ ] PermissionService
- [ ] Use cases principais (check, assign, create)
- [ ] Testes unitários de use cases
- [ ] Sistema de cache

### Sprint 4: API e Middlewares (4 dias)
- [ ] Novo middleware `verifyPermission`
- [ ] Controllers RBAC (CRUD)
- [ ] Schemas Zod
- [ ] Testes E2E da API RBAC

### Sprint 5: Migração (5 dias)
- [ ] Script de migração de usuários
- [ ] Atualizar controllers do módulo Stock
- [ ] Atualizar controllers do módulo Sales
- [ ] Atualizar controllers do módulo Core
- [ ] Testes E2E de regressão

### Sprint 6: Auditoria e Refinamento (3 dias)
- [ ] Sistema de audit logs
- [ ] Dashboard de permissões (opcional)
- [ ] Documentação completa
- [ ] Testes de performance
- [ ] Code review final

**Total Estimado:** ~25 dias úteis (~5 semanas)

---

## 📚 Referências

- **NIST RBAC Model:** https://csrc.nist.gov/projects/role-based-access-control
- **ABAC (Attribute-Based Access Control):** https://en.wikipedia.org/wiki/Attribute-based_access_control
- **AWS IAM Best Practices:** https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- **Prisma Best Practices:** https://www.prisma.io/docs/guides/performance-and-optimization

---

## 💡 Considerações Finais

Este planejamento propõe um sistema RBAC robusto, escalável e manutenível que:

1. ✅ Mantém retrocompatibilidade durante migração
2. ✅ Segue princípios SOLID e DDD
3. ✅ Possui cobertura completa de testes
4. ✅ É performático (cache + índices)
5. ✅ É extensível (suporte futuro para ABAC)
6. ✅ Possui auditoria completa
7. ✅ Facilita governança e compliance

**Próximo Passo:** Aprovação do planejamento e início da Sprint 1.

---

**Última atualização:** 17 de novembro de 2025
