# Module: Audit

## Overview

O módulo de Audit fornece o sistema de rastreabilidade e conformidade do OpenSea. Toda ação relevante realizada por usuários ou pelo sistema é persistida como um `AuditLog`, formando um histórico imutável e consultável de eventos.

**Responsabilidades principais:**

- Registro síncrono de eventos de domínio via `LogAuditUseCase`, chamado diretamente nos use cases e controllers
- Registro assíncrono via fila BullMQ (`AUDIT_LOGS`) para operações de alto volume onde a sincronia não é crítica
- Mapeamento automático de `AuditEntity` → `AuditModule` na camada de aplicação (elimina redundância nos call sites)
- Sanitização automática de campos sensíveis (`password`, `token`, `secret`, `apiKey`, `cvv`, `pin`, etc.) antes da persistência
- Consulta filtrada por tenant, usuário, ação, entidade, módulo, intervalo de datas e paginação
- Endpoint próprio do usuário autenticado (`/v1/me/audit-logs`) sem exigência de permissão administrativa
- Endpoint administrativo (`/v1/audit-logs`) protegido por permissão `audit.logs.view`
- Utilitário `logAudit()` com suporte a descrições humanizadas via placeholders `{{nomeDaVariavel}}`
- Assinatura HMAC-SHA256 de logs via `AuditSignatureService` para verificação de integridade

**Dependências de outros módulos:**

- `core/` — autenticação JWT; `userId` e `tenantId` extraídos do request via `getAuditContextFromRequest()`
- `rbac/` — permissão `audit.logs.view` protege o endpoint administrativo; `PermissionCodes.AUDIT.*` define os códigos
- Todos os demais módulos são **consumidores** do Audit: cada módulo chama `logAudit()` ou `queueAuditLog()` para registrar seus eventos

**Nota de design:** o módulo de Audit não possui escopo de tenant obrigatório. O campo `tenantId` é nullable para suportar ações do sistema (e.g., cron jobs, ações de super admin). Usuários com escopo de tenant veem apenas os logs do próprio tenant; usuários sem `tenantId` no JWT veem todos (padrão para super admins, não exposto via controller atual).

---

## Entities

### AuditLog

Registra cada evento relevante no sistema. Imutável após criação — não existe operação de update.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `action` | `AuditAction` | sim | — | Tipo da ação realizada |
| `entity` | `AuditEntity` | sim | — | Tipo da entidade afetada |
| `module` | `AuditModule` | sim | — | Módulo do sistema (inferido automaticamente) |
| `entityId` | `string` | sim | — | ID da entidade afetada |
| `description` | `string \| null` | não | `null` | Descrição humanizada (suporta placeholders resolvidos) |
| `oldData` | `Record<string, unknown> \| null` | não | `null` | Estado anterior da entidade (JSON; campos sensíveis redactados) |
| `newData` | `Record<string, unknown> \| null` | não | `null` | Novo estado da entidade (JSON; campos sensíveis redactados) |
| `ip` | `string \| null` | não | `null` | Endereço IP do requisitante (`VarChar(64)`) |
| `userAgent` | `string \| null` | não | `null` | User-Agent HTTP (`VarChar(512)`) |
| `endpoint` | `string \| null` | não | `null` | Caminho do endpoint sem query string (`VarChar(256)`) |
| `method` | `string \| null` | não | `null` | Método HTTP (GET, POST, PATCH, DELETE) |
| `tenantId` | `string \| null` | não | `null` | Tenant ao qual o log pertence (null para ações do sistema) |
| `userId` | `string \| null` | não | `null` | Usuário que realizou a ação (null para ações do sistema) |
| `affectedUser` | `string \| null` | não | `null` | ID do usuário afetado quando diferente do executor |
| `createdAt` | `Date` | não | `now()` | Data de criação |
| `expiresAt` | `Date \| null` | não | `null` | Data de expiração para limpeza automática |

**Campos resolvidos em runtime (não persistidos, presentes na resposta via join):**

| Campo | Origem | Descrição |
|-------|--------|-----------|
| `userName` | `User.profile.name + surname` ou `username` ou `email` | Nome de exibição do executor |
| `userPermissionGroups` | `User.permissionGroups[].group` | Grupos do executor no momento do log |

**Value Objects / Enums:**

- `AuditAction` — 70+ valores cobrindo CRUD, autenticação, RBAC, estoque, RH, financeiro, armazenamento e e-mail
- `AuditEntity` — 80+ valores mapeando todas as entidades de domínio rastreadas
- `AuditModule` — `CORE | AUTH | RBAC | STOCK | SALES | HR | PAYROLL | REQUESTS | NOTIFICATIONS | FINANCE | CALENDAR | STORAGE | TASKS | EMAIL | ADMIN | SYSTEM | OTHER`

---

### AuditMessage (Constant Type)

Não é uma entidade persistida, mas um tipo canônico usado pelo utilitário `logAudit()` para garantir consistência semântica nos registros.

```typescript
interface AuditMessage {
  action: AuditAction;
  entity: AuditEntity;
  module: AuditModule;
  description: string; // suporta placeholders {{variavel}}
}
```

As mensagens são organizadas em constantes por módulo em `src/constants/audit-messages/`:

| Arquivo | Constante | Escopo |
|---------|-----------|--------|
| `core.messages.ts` | `CORE_AUDIT_MESSAGES` | Auth, perfil, sessões, usuários, labels, equipes |
| `rbac.messages.ts` | `RBAC_AUDIT_MESSAGES` | Permissões, grupos |
| `stock.messages.ts` | `STOCK_AUDIT_MESSAGES` | Produtos, variantes, itens, movimentos |
| `hr.messages.ts` | `HR_AUDIT_MESSAGES` | Funcionários, ponto, ausências, férias |
| `sales.messages.ts` | `SALES_AUDIT_MESSAGES` | Pedidos, clientes, reservas |
| `finance.messages.ts` | `FINANCE_AUDIT_MESSAGES` | Entradas, pagamentos, empréstimos |
| `storage.messages.ts` | `STORAGE_AUDIT_MESSAGES` | Arquivos, pastas, versões |
| `calendar.messages.ts` | `CALENDAR_AUDIT_MESSAGES` | Eventos, participantes |
| `tasks.messages.ts` | `TASKS_AUDIT_MESSAGES` | Boards, cards |
| `admin.messages.ts` | `ADMIN_AUDIT_MESSAGES` | Tenants, planos, flags |
| `notifications.messages.ts` | `NOTIFICATIONS_AUDIT_MESSAGES` | Notificações, alertas |
| `requests.messages.ts` | `REQUESTS_AUDIT_MESSAGES` | Solicitações, aprovações |

O objeto consolidado `AUDIT_MESSAGES` (importado de `@/constants/audit-messages`) expõe todos os módulos.

---

## Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/audit-logs` | `audit.logs.view` | Lista logs com filtros completos (escopo do tenant do usuário) |
| `GET` | `/v1/me/audit-logs` | (apenas JWT) | Lista logs do próprio usuário autenticado |

### Filtros disponíveis

Ambos os endpoints aceitam os seguintes query params (todos opcionais):

| Param | Type | Description |
|-------|------|-------------|
| `userId` | `string` (UUID) | Filtrar por executor da ação |
| `affectedUser` | `string` (UUID) | Filtrar por usuário afetado (apenas `/v1/audit-logs`) |
| `action` | `string` | Valor do enum `AuditAction` |
| `entity` | `string` | Valor do enum `AuditEntity` |
| `module` | `string` | Valor do enum `AuditModule` |
| `entityId` | `string` | ID da entidade afetada |
| `startDate` | `string` (ISO 8601) | Data de início do intervalo |
| `endDate` | `string` (ISO 8601) | Data de fim do intervalo |
| `page` | `number` | Página (padrão: 1) |
| `limit` | `number` | Itens por página (padrão: 20, máx: 100) |

**Comportamento especial:** quando `entity` e `entityId` são fornecidos simultaneamente, o use case usa `listByEntity()` em vez do `listAll()` genérico, otimizando a consulta para histórico de uma entidade específica (e.g., todos os logs do produto `abc-123`).

---

### Request/Response Examples

#### GET /v1/audit-logs

```
GET /v1/audit-logs?entity=PRODUCT&module=STOCK&startDate=2026-03-01T00:00:00.000Z&page=1&limit=20
Authorization: Bearer <tenant-scoped-jwt>
```

```json
// Response 200
{
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "action": "UPDATE",
      "entity": "PRODUCT",
      "module": "STOCK",
      "entityId": "550e8400-e29b-41d4-a716-446655440099",
      "description": "João Silva atualizou o produto Camiseta Básica",
      "oldData": { "name": "Camiseta", "price": 49.90 },
      "newData": { "name": "Camiseta Básica", "price": 54.90 },
      "userId": "550e8400-e29b-41d4-a716-446655440010",
      "userName": "João Silva",
      "userPermissionGroups": [
        { "id": "...", "name": "Gestor de Estoque", "slug": "gestor-estoque", "color": "#3b82f6", "priority": 10 }
      ],
      "affectedUser": null,
      "ip": "200.185.12.34",
      "userAgent": "Mozilla/5.0 ...",
      "endpoint": "/v1/products/550e8400-...",
      "method": "PATCH",
      "createdAt": "2026-03-10T14:32:00.000Z"
    }
  ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### GET /v1/me/audit-logs

```
GET /v1/me/audit-logs?action=LOGIN&limit=10
Authorization: Bearer <tenant-scoped-jwt>
```

```json
// Response 200
{
  "logs": [
    {
      "id": "...",
      "action": "LOGIN",
      "entity": "SESSION",
      "module": "CORE",
      "entityId": "session-uuid",
      "description": "Maria Santos acessou o sistema",
      "oldData": null,
      "newData": null,
      "ip": "189.40.100.5",
      "userAgent": "Mozilla/5.0 ...",
      "endpoint": "/v1/auth/sessions",
      "method": "POST",
      "createdAt": "2026-03-10T08:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Nota:** o endpoint `/v1/me/audit-logs` **não** expõe `userName`, `userPermissionGroups` nem `affectedUser` — a resposta é filtrada para dados não sensíveis do próprio usuário.

---

## Business Rules

### Regra 1: Mapeamento automático de entidade para módulo

O `LogAuditUseCase` determina o `AuditModule` a partir do `AuditEntity` fornecido, usando o método privado `getModuleFromEntity()`. O chamador não precisa (e não deve) especificar o módulo manualmente.

O mapeamento cobre todos os grupos de entidades:

- Entidades de usuário/sessão/refresh token → `CORE`
- Entidades de permissão/grupo → `RBAC`
- Entidades de produto/variante/item/movimento/etc. → `STOCK`
- Entidades de pedido/cliente/reserva/comentário → `SALES`
- Entidades de funcionário/ponto/ausência/férias → `HR`
- Entidades de folha de pagamento → `PAYROLL`
- Entidades financeiras → `FINANCE`
- Entidades de storage → `STORAGE`
- Entidades de calendário/evento → `CALENDAR` (não implementado no mapeamento — resulta em `OTHER`)
- Entidades de equipe/template/PIN → `CORE`
- Entidades de tenant/plano/feature flag → `ADMIN`
- Demais → `OTHER`

**Inconsistência detectada:** as entidades `CALENDAR_EVENT`, `EVENT_PARTICIPANT` e `EVENT_REMINDER` do enum `AuditEntity` não estão mapeadas explicitamente em `getModuleFromEntity()`, resultando em módulo `OTHER` ao invés de `CALENDAR`. O mapeamento de TASKS e EMAIL também está ausente.

### Regra 2: Sanitização de campos sensíveis

Antes de qualquer persistência, `oldData` e `newData` são sanitizados para remover campos confidenciais. Campos redactados são substituídos pelo valor literal `'[REDACTED]'`.

**Campos sanitizados (case-insensitive, por substring):**

`password`, `passwordHash`, `token`, `refreshToken`, `accessToken`, `secret`, `apiKey`, `creditCard`, `cvv`, `pin`

A sanitização ocorre em dois locais independentes:

1. `LogAuditUseCase.sanitizeData()` — chamado no use case direto
2. `audit.helper.ts / sanitizeData()` — chamado pelo utilitário `logAudit()` com lógica mais abrangente (substring matching)

A sanitização no helper também é **recursiva** — inspeciona objetos aninhados.

### Regra 3: Resiliência total — erros de auditoria não interrompem operações

Tanto o `LogAuditUseCase` quanto o utilitário `logAudit()` capturam todas as exceções internamente. Se a persistência do log falhar (banco indisponível, constraint violada, etc.), o erro é registrado via `console.error('[AUDIT] ...')` e a operação principal continua normalmente.

```typescript
// Padrão no LogAuditUseCase
try {
  await this.auditLogsRepository.log(auditLog);
} catch (error) {
  console.error('[AUDIT] Failed to log audit:', error);
  // sem re-throw
}
```

### Regra 4: Isolamento de tenant no endpoint administrativo

O controller `listAuditLogsController` extrai `tenantId` do JWT do usuário autenticado e passa-o obrigatoriamente ao use case. Isso garante que usuários com escopo de tenant visualizem apenas os logs do próprio tenant, mesmo com a permissão `audit.logs.view`.

Usuários sem `tenantId` no JWT (e.g., super admins — cenário não exposto pelo controller atual) receberiam todos os logs do sistema.

### Regra 5: Consulta otimizada por entidade + entityId

Quando `entity` e `entityId` são fornecidos simultaneamente, o `ListAuditLogsUseCase` usa o método especializado `listByEntity()` do repositório em vez do `listAll()` genérico. Isso permite que queries de histórico de uma entidade específica sejam servidas pelo índice composto `@@index([entity, entityId])` do Prisma.

### Regra 6: Expiração automática de logs

O campo `expiresAt` permite configurar um TTL por log. O repositório expõe `deleteExpired()` para limpeza via cron ou job agendado. A API de listagem não filtra logs expirados automaticamente — cabe ao processo de cleanup removê-los.

### Regra 7: Descrições humanizadas com placeholders

O utilitário `logAudit()` aceita um objeto `placeholders` e substitui ocorrências de `{{nomeDaVariavel}}` na string `description` da `AuditMessage`. Placeholders não resolvidos (chave ausente no objeto) são mantidos literalmente.

Adicionalmente, o objeto `placeholders` resolvido é salvo dentro de `newData._placeholders` para que o frontend possa estilizar partes da descrição programaticamente.

```typescript
await logAudit(request, {
  message: AUDIT_MESSAGES.HR.EMPLOYEE_CREATE,
  entityId: employee.id.toString(),
  placeholders: {
    adminName: 'João Silva',
    employeeName: 'Maria Santos',
  },
  newData: { name: 'Maria Santos', department: 'Vendas' },
});
// description persistida: "João Silva cadastrou o funcionário Maria Santos"
// newData persistido: { name: "Maria Santos", department: "Vendas", _placeholders: { adminName: "João Silva", ... } }
```

### Regra 8: Fila assíncrona para alto volume

Para operações onde a auditoria não precisa ser síncrona (e.g., download de anexo de e-mail, compartilhamento de arquivo), usa-se `queueAuditLog()` ou `queueBulkAuditLogs()` em vez de `logAudit()`.

- Fila: `AUDIT_LOGS` (BullMQ, inicialização lazy)
- Prioridade dos jobs: `1` (baixa — não bloqueia filas críticas)
- Worker: concorrência `20`, rate limiter `100 logs/segundo`

**Atenção:** o worker de audit (`startAuditWorker()` em `audit.queue.ts`) contém atualmente apenas logging de console e um TODO de implementação real. Os logs enfileirados via `queueAuditLog()` **não são persistidos no banco** pelo worker — apenas logados no console do processo worker. A persistência real é feita exclusivamente pelo caminho síncrono via `LogAuditUseCase`.

### Regra 9: Integridade via assinatura HMAC-SHA256

O `AuditSignatureService` permite assinar e verificar a integridade de audit logs usando HMAC-SHA256. A assinatura é baseada nos campos `userId`, `action`, `entity`, `entityId`, `module`, `oldData`, `newData`, `metadata` e `createdAt` (normalizados com chaves ordenadas).

A comparação usa `timingSafeEqual` para prevenir timing attacks.

```typescript
const service = getAuditSignatureService(); // singleton
const sig = service.generateSignature(logData);
const valid = service.verifySignature(logData, sig);
```

**Variável de ambiente:** `AUDIT_HMAC_SECRET` (opcional — deriva de `JWT_SECRET + '-audit'` se ausente).

**Estado atual:** o campo `signature` não existe no modelo Prisma — a assinatura está implementada como serviço mas não é persistida no banco.

---

## Services

### AuditSignatureService

**Localização:** `src/services/audit/audit-signature-service.ts`

Serviço singleton para geração e verificação de assinaturas HMAC-SHA256 de audit logs. Expõe também a função utilitária `verifyAuditLogChain()` para verificação em lote.

### logAudit() — Helper de controller

**Localização:** `src/http/helpers/audit.helper.ts`

Função principal para registrar auditoria a partir de controllers Fastify. Extrai contexto do request automaticamente, substitui placeholders, sanitiza dados e delega ao `LogAuditUseCase`.

```typescript
// Uso típico em um controller
await logAudit(request, {
  message: AUDIT_MESSAGES.CORE.USER_CREATE,
  entityId: user.id.toString(),
  placeholders: { adminName: adminUser.name, userName: newUser.name },
  newData: { email: newUser.email },
});
```

Função derivada `createAuditLogger(message)` pré-fixa a mensagem para reutilização:

```typescript
const logUserCreate = createAuditLogger(AUDIT_MESSAGES.CORE.USER_CREATE);
await logUserCreate(request, { entityId: user.id, placeholders: { ... } });
```

### getAuditContextFromRequest()

**Localização:** `src/http/helpers/audit.helper.ts`

Extrai `userId`, `tenantId`, `ip`, `userAgent`, `endpoint` (sem query string) e `method` do request Fastify para uso no log de auditoria.

---

## Use Cases

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `LogAuditUseCase` | `src/use-cases/audit/log-audit.ts` | Cria um `AuditLog`, inferindo o módulo e sanitizando dados sensíveis. Erros são silenciosos. |
| `ListAuditLogsUseCase` | `src/use-cases/audit/list-audit-logs.ts` | Lista logs com filtros compostos. Usa `listByEntity()` quando `entity + entityId` presentes, senão `listAll()`. |

**Factories:**

| Factory | Arquivo |
|---------|---------|
| `makeLogAuditUseCase()` | `src/use-cases/audit/factories/make-log-audit-use-case.ts` |
| `makeListAuditLogsUseCase()` | `src/use-cases/audit/factories/make-list-audit-logs-use-case.ts` |

---

## BullMQ Queue

### AUDIT_LOGS

**Arquivo:** `src/workers/queues/audit.queue.ts`

```typescript
export interface AuditLogJobData {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  module: string;
  description?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}
```

**Inicialização lazy:** a conexão Redis só é criada na primeira chamada a `queueAuditLog()`.

**Worker:** `startAuditWorker()` — concorrência 20, rate limiter 100/segundo.

**Funções públicas:**

- `queueAuditLog(data)` — enfileira um único log
- `queueBulkAuditLogs(logs[])` — enfileira múltiplos logs via `addBulk()`

---

## Repository Interface

**Localização:** `src/repositories/audit/audit-logs-repository.ts`

O `AuditLogsRepository` é uma interface rica com suporte a analytics:

### Operações de criação

| Método | Descrição |
|--------|-----------|
| `log(data)` | Persiste um único audit log, retorna a entidade criada |
| `logMany(data[])` | Persiste múltiplos logs via `createMany` (sem retorno individual) |

### Operações de leitura

| Método | Descrição |
|--------|-----------|
| `findById(id)` | Busca log por ID com join de usuário |
| `listAll(params?)` | Lista com filtros compostos, paginação e ordenação |
| `listRecent(limit?)` | Lista os N logs mais recentes (padrão: 100) |
| `listByUserId(userId, params?)` | Atalho para `listAll` com filtro de userId |
| `listByAffectedUser(userId, params?)` | Atalho para `listAll` com filtro de affectedUser |
| `listByModule(module, params?)` | Atalho para `listAll` com filtro de módulo |
| `listByEntity(entity, entityId, params?)` | Atalho para `listAll` com filtro de entity + entityId |
| `listByAction(action, params?)` | Atalho para `listAll` com filtro de ação |

### Operações de estatísticas

| Método | Descrição |
|--------|-----------|
| `getStatistics(params?)` | Totais agrupados por ação, entidade, módulo, usuários e entidades únicos |
| `getModuleStatistics(module, params?)` | Estatísticas de um módulo específico |
| `getUserActivitySummary(userId, ...)` | Resumo de atividade de um usuário (ações realizadas + recebidas) |
| `getMostActiveUsers(limit?, ...)` | Top N usuários por atividade total |
| `getMostAuditedEntities(limit?)` | Top N entidades por volume de logs |
| `getActionTrends(start, end, interval)` | Tendência de ações ao longo do tempo |

### Operações de limpeza

| Método | Descrição |
|--------|-----------|
| `deleteOlderThan(date)` | Remove logs anteriores à data, retorna contagem |
| `deleteExpired()` | Remove logs com `expiresAt < now()`, retorna contagem |
| `deleteByEntity(entity, entityId)` | Remove todos os logs de uma entidade específica |
| `deleteAll()` | Remove todos os logs (uso em testes) |

### Utilitários

| Método | Descrição |
|--------|-----------|
| `count(params?)` | Contagem com os mesmos filtros do `listAll` |
| `exists(id)` | Verifica se um log existe |

**Ordenação disponível** (`ListAuditLogsParams.sortBy`): `createdAt` | `action` | `entity` | `module`

**Implementações:**

| Implementação | Localização | Uso |
|---------------|-------------|-----|
| `PrismaAuditLogsRepository` | `src/repositories/audit/prisma/prisma-audit-logs-repository.ts` | Produção |
| `InMemoryAuditLogsRepository` | `src/repositories/audit/in-memory/in-memory-audit-logs-repository.ts` | Testes unitários |

---

## Permissions

| Code | Description | Scope |
|------|-------------|-------|
| `audit.logs.read` | Ler um log de auditoria por ID | Por tenant |
| `audit.logs.view` | Visualizar a listagem de logs (usado no controller atual) | Por tenant |
| `audit.logs.list` | Listar logs de auditoria | Por tenant |
| `audit.logs.search` | Pesquisar logs de auditoria | Por tenant |
| `audit.history.view` | Visualizar histórico de auditoria de uma entidade | Por tenant |
| `audit.rollback.preview` | Pré-visualizar rollback de estado | Por tenant |
| `audit.rollback.execute` | Executar rollback de estado | Por tenant |
| `audit.compare.view` | Comparar dois estados via diff | Por tenant |
| `self.audit.read` | Ler próprios logs (endpoint `/v1/me/audit-logs`) | Próprio usuário |
| `self.audit.list` | Listar próprios logs | Próprio usuário |
| `ui.menu.audit` | Exibir menu de auditoria na interface | UI |
| `reports.audit.view` | Visualizar relatórios de auditoria | Por tenant |
| `reports.audit.generate` | Gerar relatórios de auditoria | Por tenant |
| `reports.audit.user-activity` | Relatório de atividade por usuário | Por tenant |
| `reports.audit.security` | Relatório de eventos de segurança | Por tenant |
| `data.export.audit` | Exportar logs de auditoria | Por tenant |

**Nota:** o controller `listAuditLogsController` usa especificamente `PermissionCodes.AUDIT.LOGS.VIEW` (`audit.logs.view`). O endpoint `/v1/me/audit-logs` exige apenas JWT válido, sem permissão adicional.

---

## Data Model

Trecho do `prisma/schema.prisma` (modelo AuditLog):

```prisma
model AuditLog {
  id String @id @default(uuid())

  // Multi-Tenant (nullable for system actions)
  tenantId String? @map("tenant_id")

  action      AuditAction
  entity      AuditEntity
  module      AuditModule
  entityId    String      @map("entity_id")
  description String?     @db.VarChar(512)
  oldData     Json?       @map("old_data")
  newData     Json?       @map("new_data")

  // Request metadata
  ip        String? @db.VarChar(64)
  userAgent String? @map("user_agent") @db.VarChar(512)
  endpoint  String? @db.VarChar(256)
  method    String? @db.VarChar(10)

  // User info
  userId       String? @map("user_id")
  affectedUser String? @map("affected_user")

  createdAt DateTime  @default(now()) @map("created_at")
  expiresAt DateTime? @map("expires_at")

  tenant Tenant? @relation(fields: [tenantId], references: [id])
  user   User?   @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([tenantId, createdAt])
  @@index([userId])
  @@index([affectedUser])
  @@index([action])
  @@index([entity])
  @@index([module])
  @@index([entityId])
  @@index([createdAt])
  @@index([expiresAt])
  @@index([entity, entityId])          -- lookup de histórico por entidade
  @@index([module, createdAt])         -- listagem por módulo ordenada por data
  @@index([userId, action])            -- atividade de um usuário por tipo de ação
  @@map("audit_logs")
}
```

**Índices críticos para performance:**

- `[entity, entityId]` — histórico de uma entidade específica
- `[tenantId, createdAt]` — listagem tenant-scoped ordenada por data
- `[module, createdAt]` — dashboards de atividade por módulo
- `[userId, action]` — análise de padrões de comportamento por usuário
- `[expiresAt]` — limpeza eficiente de logs expirados

**Enums do Prisma:** `AuditAction`, `AuditEntity` e `AuditModule` são declarados diretamente no `schema.prisma` e espelham os enums TypeScript em `src/entities/audit/`.

---

## Tests

- **Testes unitários:** 2 arquivos, 9 testes (todos passando)
  - `src/use-cases/audit/log-audit.spec.ts` — 4 testes: criação de log, mapeamento de módulo, sanitização de senha, resiliência a erros de repositório
  - `src/use-cases/audit/list-audit-logs.spec.ts` — 5 testes: listagem geral, filtro por userId, filtro por entity, filtro por entity+entityId, paginação

- **Testes E2E:** 2 arquivos, 3 testes
  - `src/http/controllers/audit/v1-list-audit-logs.e2e.spec.ts` — 1 teste: verifica schema da resposta e isolamento de tenant
  - `src/http/controllers/core/me/v1-list-my-audit-logs.e2e.spec.ts` — 1 teste: verifica schema da resposta para endpoint do usuário

**Cenários críticos cobertos:**

- Mapeamento automático de `AuditEntity.USER` → `AuditModule.CORE`
- Mapeamento automático de `AuditEntity.PRODUCT` → `AuditModule.STOCK`
- Sanitização: `password` é redactado, `email` é mantido
- Resiliência: exceção no repositório não propaga para o chamador
- Filtro por `userId` com múltiplos usuários no repositório
- Filtro por `entity` com entidades distintas
- Filtro combinado `entity + entityId` (usa `listByEntity`)
- Paginação: 25 logs, página 1, limit 10 → totalPages 3
- Estrutura da resposta HTTP: campos `logs`, `pagination.total`, `pagination.totalPages`

**Repositório de testes:** `InMemoryAuditLogsRepository` em `src/repositories/audit/in-memory/in-memory-audit-logs-repository.ts`. Não há factory de dados de teste específica para o módulo de audit — os testes criam os logs diretamente via `prisma.auditLog.createMany()` (E2E) ou `auditLogsRepository.log()` (unitário).

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Documentação inicial gerada | — | Este arquivo |

**Inconsistências identificadas durante documentação:**

1. **Worker assíncrono incompleto:** `startAuditWorker()` em `audit.queue.ts` contém apenas logging de console e um TODO — logs enfileirados via `queueAuditLog()` não são persistidos no banco.
2. **Mapeamento de módulo incompleto:** entidades `CALENDAR_EVENT`, `EVENT_PARTICIPANT`, `EVENT_REMINDER`, `EMAIL_ACCOUNT`, `EMAIL_MESSAGE`, `EMAIL_ATTACHMENT`, `TASK_BOARD`, `TASK_CARD` não estão no `getModuleFromEntity()` do `LogAuditUseCase`, resultando em módulo `OTHER`.
3. **Assinatura não persistida:** `AuditSignatureService` está implementado mas o campo `signature` não existe no modelo Prisma — o serviço existe mas não é usado em produção.
4. **Cobertura E2E mínima:** apenas 3 testes E2E para um sistema crítico de compliance. Filtros combinados, date range, paginação e escopo de tenant não são cobertos por E2E.
