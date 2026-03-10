# Module: Calendar

## Overview

O módulo Calendar fornece uma agenda corporativa completa para tenants do OpenSea. Permite criar e gerenciar eventos com suporte a recorrência via RRULE, convidar participantes, configurar lembretes, exportar para o formato iCal (`.ics`) e integrar automaticamente eventos provenientes de outros módulos do sistema (RH, Financeiro, Estoque).

**Escopo funcional:**
- Calendários pessoais, de equipe (TEAM) e de sistema (SYSTEM)
- Eventos com ou sem recorrência (RRULE RFC 5545), fuso horário configurável
- Participantes com papéis (OWNER / ASSIGNEE / GUEST) e sistema de RSVP
- Lembretes por minutos de antecedência, processados em batch
- Privacidade de eventos: visibilidade `PRIVATE` oculta detalhes para não-participantes
- Eventos de sistema (read-only) criados automaticamente via `CalendarSyncService`
- Feriados nacionais brasileiros injetados sinteticamente na listagem
- Exportação iCal via pacote `ical-generator`
- Soft delete em calendários e eventos

**Dependências com outros módulos:**
- `core` — autenticação JWT, `verifyTenant`, usuários (resolução de nome do criador)
- `hr` — ausências e aniversários de funcionários sincronizados automaticamente
- `finance` — lançamentos financeiros (vencimentos) sincronizados automaticamente
- `stock` — pedidos de compra (purchase orders) sincronizados automaticamente
- `notifications` — envio de notificações IN_APP e EMAIL em convites, RSVP e lembretes
- `rbac` — controle de acesso granular por permissão
- `plan-modules` — módulo `CALENDAR` deve estar habilitado no plano do tenant

---

## Entities

### Calendar

Representa um calendário que agrupa eventos. Pode ser pessoal de um usuário, pertencente a uma equipe ou mantido pelo sistema.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `tenantId` | `UniqueEntityID` | sim | — | Tenant proprietário |
| `name` | `string` | sim | — | Nome do calendário (máx. 128 chars) |
| `description` | `string \| null` | não | `null` | Descrição opcional |
| `color` | `string \| null` | não | `null` | Cor em hex (`#RRGGBB`) |
| `type` | `'PERSONAL' \| 'TEAM' \| 'SYSTEM'` | sim | — | Tipo do calendário |
| `ownerId` | `string \| null` | não | `null` | ID do usuário (PERSONAL) ou equipe (TEAM) proprietário |
| `systemModule` | `string \| null` | não | `null` | Módulo de sistema associado (`HR`, `FINANCE`, `STOCK`) |
| `isDefault` | `boolean` | sim | `false` | Indica se é o calendário padrão |
| `settings` | `Record<string, unknown>` | sim | `{}` | Configurações arbitrárias em JSON |
| `createdBy` | `UniqueEntityID` | sim | — | Usuário criador |
| `deletedAt` | `Date \| null` | não | `null` | Data de exclusão lógica |
| `createdAt` | `Date` | sim | `now()` | Data de criação |
| `updatedAt` | `Date \| null` | não | auto | Data da última atualização |

**Computed getters:**
- `isPersonal` — `type === 'PERSONAL'`
- `isTeam` — `type === 'TEAM'`
- `isSystem` — `type === 'SYSTEM'`
- `isDeleted` — `deletedAt !== null`

**Regras de criação:**
- Calendários pessoais são criados automaticamente (`findOrCreatePersonal`) ao criar o primeiro evento sem `calendarId`
- Calendários pessoais nunca podem ser deletados (`canDelete: false` em `resolveCalendarAccess`)
- Calendários de sistema são criados via `EnsureSystemCalendarsUseCase` com cores fixas: RH `#8b5cf6`, Financeiro `#10b981`, Estoque `#f59e0b`

---

### CalendarEvent

Representa um evento dentro de um calendário.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `tenantId` | `UniqueEntityID` | sim | — | Tenant proprietário |
| `calendarId` | `string \| null` | não | `null` | Calendário ao qual pertence |
| `title` | `string` | sim | — | Título do evento (máx. 256 chars) |
| `description` | `string \| null` | não | `null` | Descrição (máx. 5000 chars) |
| `location` | `string \| null` | não | `null` | Local (máx. 512 chars) |
| `startDate` | `Date` | sim | — | Data e hora de início |
| `endDate` | `Date` | sim | — | Data e hora de fim (deve ser > `startDate`) |
| `isAllDay` | `boolean` | sim | `false` | Evento de dia inteiro |
| `type` | `EventType` | sim | `'CUSTOM'` | Tipo do evento (ver enum abaixo) |
| `visibility` | `EventVisibility` | sim | `'PUBLIC'` | Visibilidade (PUBLIC ou PRIVATE) |
| `color` | `string \| null` | não | `null` | Cor override em hex (`#RRGGBB`) |
| `rrule` | `string \| null` | não | `null` | Regra de recorrência RFC 5545 (máx. 512 chars) |
| `timezone` | `string \| null` | não | `null` | Fuso horário IANA (ex.: `America/Sao_Paulo`) |
| `systemSourceType` | `string \| null` | não | `null` | Identificador do módulo de origem (`HR_ABSENCE`, `FINANCE_ENTRY`, `STOCK_PO`, `HR_BIRTHDAY`, `TASK_DUE`, `HOLIDAY`) |
| `systemSourceId` | `string \| null` | não | `null` | ID da entidade de origem no módulo |
| `metadata` | `Record<string, unknown>` | sim | `{}` | Dados arbitrários em JSON |
| `createdBy` | `UniqueEntityID` | sim | — | Usuário criador |
| `deletedAt` | `Date \| null` | não | `null` | Data de exclusão lógica |
| `createdAt` | `Date` | sim | `now()` | Data de criação |
| `updatedAt` | `Date \| null` | não | auto | Data da última atualização |

**Computed getters:**
- `isSystemEvent` — `systemSourceType !== null && systemSourceId !== null`
- `isRecurring` — `rrule !== null`
- `isPrivate` — `visibility === 'PRIVATE'`
- `isDeleted` — `deletedAt !== null`

---

### EventParticipant

Associa um usuário a um evento com um papel e status de resposta.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `tenantId` | `UniqueEntityID` | sim | — | Tenant proprietário |
| `eventId` | `UniqueEntityID` | sim | — | Evento associado |
| `userId` | `UniqueEntityID` | sim | — | Usuário participante |
| `role` | `ParticipantRole` | sim | `'GUEST'` | Papel no evento |
| `status` | `ParticipantStatus` | sim | `'PENDING'` | Status de resposta |
| `respondedAt` | `Date \| null` | não | `null` | Timestamp da resposta |
| `createdAt` | `Date` | sim | `now()` | Data de criação |
| `updatedAt` | `Date \| null` | não | auto | Data da última atualização |

**Método de domínio:** `respond(status)` — atualiza `status` e `respondedAt` atomicamente.

**Constraint:** `@@unique([eventId, userId])` — um usuário só pode ser participante uma vez por evento.

---

### EventReminder

Configura um lembrete antecipado para um participante de um evento.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `tenantId` | `UniqueEntityID` | sim | — | Tenant proprietário |
| `eventId` | `UniqueEntityID` | sim | — | Evento associado |
| `userId` | `UniqueEntityID` | sim | — | Usuário que receberá o lembrete |
| `minutesBefore` | `number` (int) | sim | — | Minutos antes do evento (0 a 40320 = 28 dias) |
| `isSent` | `boolean` | sim | `false` | Se o lembrete já foi enviado |
| `sentAt` | `Date \| null` | não | `null` | Timestamp de envio |
| `createdAt` | `Date` | sim | `now()` | Data de criação |

**Método de domínio:** `markSent()` — define `isSent = true` e registra `sentAt`.

**Constraint:** `@@unique([eventId, userId, minutesBefore])` — sem duplicatas de lembrete para o mesmo usuário e antecedência.

---

## Enums

### EventType

| Valor | Descrição |
|-------|-----------|
| `MEETING` | Reunião |
| `TASK` | Tarefa |
| `REMINDER` | Lembrete simples |
| `DEADLINE` | Prazo / deadline |
| `HOLIDAY` | Feriado (injetado sinteticamente ou via sistema) |
| `BIRTHDAY` | Aniversário (sincronizado via `CalendarSyncService`) |
| `VACATION` | Férias de funcionário |
| `ABSENCE` | Ausência de funcionário |
| `FINANCE_DUE` | Vencimento ou recebimento financeiro |
| `PURCHASE_ORDER` | Pedido de compra com data de entrega |
| `CUSTOM` | Tipo personalizado (padrão) |

### EventVisibility

| Valor | Descrição |
|-------|-----------|
| `PUBLIC` | Visível para todos os usuários do tenant |
| `PRIVATE` | Detalhes ocultados para não-participantes (exibe apenas "Ocupado") |

### ParticipantRole

| Valor | Descrição |
|-------|-----------|
| `OWNER` | Criador do evento; único com permissão para editar, excluir e gerenciar participantes |
| `ASSIGNEE` | Responsável pela execução; não pode gerenciar o evento |
| `GUEST` | Convidado simples; pode responder ao convite |

### ParticipantStatus

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Convite enviado, sem resposta |
| `ACCEPTED` | Participante confirmou presença |
| `DECLINED` | Participante recusou |
| `TENTATIVE` | Participante respondeu "talvez" |

### CalendarType

| Valor | Descrição |
|-------|-----------|
| `PERSONAL` | Calendário pessoal de um usuário |
| `TEAM` | Calendário compartilhado de uma equipe |
| `SYSTEM` | Calendário de sistema (RH, Financeiro, Estoque) |

---

## Endpoints

Todos os endpoints requerem `verifyJwt` + `verifyTenant`. O módulo `CALENDAR` deve estar habilitado no plano do tenant (verificado via `createModuleMiddleware('CALENDAR')`).

### Calendars

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/calendar/calendars` | — | Lista calendários do usuário autenticado |
| `GET` | `/v1/calendar/calendars/:id` | — | Busca um calendário por ID |
| `POST` | `/v1/calendar/calendars/team` | — | Cria calendário de equipe |
| `PATCH` | `/v1/calendar/calendars/:id` | — | Atualiza nome/descrição/cor |
| `DELETE` | `/v1/calendar/calendars/:id` | — | Remove calendário (soft delete) |
| `PUT` | `/v1/calendar/calendars/:id/permissions` | — | Atualiza permissões de acesso de equipe |

### Events

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/calendar/events` | `calendar.events.list` | Lista eventos em um intervalo de datas |
| `GET` | `/v1/calendar/events/export` | `calendar.events.export` | Exporta eventos como arquivo iCal (.ics) |
| `GET` | `/v1/calendar/events/:id` | `calendar.events.read` | Busca evento por ID |
| `POST` | `/v1/calendar/events` | `calendar.events.create` | Cria novo evento |
| `PATCH` | `/v1/calendar/events/:id` | `calendar.events.update` | Atualiza evento existente |
| `DELETE` | `/v1/calendar/events/:id` | `calendar.events.delete` | Remove evento (soft delete) |
| `POST` | `/v1/calendar/events/:id/participants` | `calendar.participants.invite` | Convida participantes |
| `POST` | `/v1/calendar/events/:id/respond` | `calendar.participants.respond` | Responde ao convite (RSVP) |
| `DELETE` | `/v1/calendar/events/:id/participants/:userId` | `calendar.participants.manage` | Remove participante |
| `POST` | `/v1/calendar/events/:id/share/users` | `calendar.events.share-users` | Compartilha evento com usuários específicos |
| `POST` | `/v1/calendar/events/:id/share/team` | `calendar.events.share-teams` | Compartilha evento com toda a equipe |
| `DELETE` | `/v1/calendar/events/:id/share/:userId` | `calendar.events.share-users` | Remove compartilhamento com um usuário |
| `PUT` | `/v1/calendar/events/:id/reminders` | `calendar.reminders.create` | Gerencia lembretes do usuário para o evento |
| `POST` | `/v1/calendar/events/process-reminders` | `calendar.events.manage` | Processa lembretes vencidos (uso interno/cron) |

---

## Request/Response Examples

### POST /v1/calendar/events

**Request body:**
```json
{
  "title": "Reunião de planejamento trimestral",
  "description": "Revisão de metas e OKRs do Q2",
  "location": "Sala de conferências A",
  "startDate": "2026-04-01T09:00:00.000Z",
  "endDate": "2026-04-01T10:00:00.000Z",
  "isAllDay": false,
  "type": "MEETING",
  "visibility": "PUBLIC",
  "color": "#3b82f6",
  "timezone": "America/Sao_Paulo",
  "participants": [
    { "userId": "uuid-do-colega", "role": "ASSIGNEE" }
  ],
  "reminders": [
    { "minutesBefore": 15 },
    { "minutesBefore": 60 }
  ]
}
```

**Response 201:**
```json
{
  "event": {
    "id": "uuid-do-evento",
    "tenantId": "uuid-do-tenant",
    "calendarId": "uuid-do-calendario",
    "title": "Reunião de planejamento trimestral",
    "startDate": "2026-04-01T09:00:00.000Z",
    "endDate": "2026-04-01T10:00:00.000Z",
    "isAllDay": false,
    "type": "MEETING",
    "visibility": "PUBLIC",
    "isRecurring": false,
    "occurrenceDate": null,
    "participants": [
      {
        "id": "uuid",
        "userId": "uuid-do-criador",
        "role": "OWNER",
        "status": "ACCEPTED",
        "userName": "João Silva",
        "userEmail": "joao@empresa.com"
      }
    ],
    "reminders": [
      { "id": "uuid", "minutesBefore": 15, "isSent": false }
    ],
    "createdAt": "2026-03-10T00:00:00.000Z"
  }
}
```

### GET /v1/calendar/events

**Query params:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `startDate` | `ISO date` | sim | — | Início do intervalo |
| `endDate` | `ISO date` | sim | — | Fim do intervalo (máx. 90 dias após startDate) |
| `type` | `EventType` | não | — | Filtro por tipo |
| `search` | `string` | não | — | Busca por título |
| `includeSystemEvents` | `'true'` | não | — | Incluir eventos de sistema |
| `calendarIds` | `string` (CSV) | não | — | Filtrar por calendários (ex.: `id1,id2`) |
| `page` | `number` | não | `1` | Página |
| `limit` | `number` | não | `500` | Resultados por página (máx. 1000) |

### GET /v1/calendar/events/export

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | `ISO date` | sim | Início do intervalo (máx. 90 dias) |
| `endDate` | `ISO date` | sim | Fim do intervalo |
| `type` | `EventType` | não | Filtro por tipo |
| `includeSystemEvents` | `'true'` | não | Incluir eventos de sistema |
| `calendarId` | `UUID` | não | Exportar apenas de um calendário pessoal específico |

**Response:** arquivo `opensea-agenda.ics` com `Content-Type: text/calendar; charset=utf-8`

### POST /v1/calendar/events/:id/participants

**Request body:**
```json
{
  "participants": [
    { "userId": "uuid-do-usuario", "role": "GUEST" }
  ]
}
```

**Response 200:**
```json
{ "invited": 1 }
```

### POST /v1/calendar/events/:id/respond

**Request body:**
```json
{ "status": "ACCEPTED" }
```

**Response 200:**
```json
{ "participantId": "uuid", "status": "ACCEPTED" }
```

### PUT /v1/calendar/events/:id/reminders

**Request body (substitui todos os lembretes do usuário no evento):**
```json
{
  "reminders": [
    { "minutesBefore": 10 },
    { "minutesBefore": 1440 }
  ]
}
```

**Response 200:**
```json
{ "count": 2 }
```

---

## Business Rules

### Regra 1: Criador sempre vira OWNER

Ao criar um evento, o usuário autenticado é adicionado automaticamente à lista de participantes com o papel `OWNER`, independentemente dos participantes informados no corpo da requisição. Participantes duplicados com o mesmo `userId` do criador são filtrados.

```typescript
const participants = [
  { userId, role: 'OWNER' },
  ...(request.participants ?? []).filter((p) => p.userId !== userId),
];
```

### Regra 2: Auto-resolução do calendário pessoal

Se o campo `calendarId` não for informado ao criar um evento, o controller resolve automaticamente o calendário pessoal do usuário (criando-o se necessário via `CreatePersonalCalendarUseCase`). Eventos nunca ficam sem calendário associado.

### Regra 3: Limite de intervalo de datas (90 dias)

A listagem de eventos (`GET /v1/calendar/events`) e a exportação iCal (`GET /v1/calendar/events/export`) validam que o intervalo `endDate - startDate` não exceda 90 dias. Requisições fora desse limite retornam `400 Bad Request`.

### Regra 4: Privacidade de eventos (PRIVATE)

Ao buscar um evento (`GET /v1/calendar/events/:id`), se o evento tem `visibility = 'PRIVATE'` e o solicitante não é o criador nem está na lista de participantes, a resposta é retornada com os campos sensíveis zerados:

```typescript
{
  title: 'Ocupado',
  description: null,
  location: null,
  participants: [],
  reminders: [],
  metadata: {},
}
```

Os demais campos (datas, tipo, ID) permanecem visíveis para que o usuário saiba que o horário está bloqueado.

### Regra 5: Eventos de sistema são imutáveis

Eventos com `systemSourceType` e `systemSourceId` preenchidos são considerados eventos de sistema (`isSystemEvent = true`). Tentativas de atualização ou exclusão retornam `400 Bad Request`:

- `UpdateCalendarEventUseCase`: `'System events cannot be edited'`
- `DeleteCalendarEventUseCase`: `'System events cannot be deleted'`

Esses eventos são gerenciados exclusivamente pelo `CalendarSyncService`.

### Regra 6: Apenas o OWNER pode editar, excluir e gerenciar participantes

- **Edição:** `UpdateCalendarEventUseCase` verifica `event.createdBy === userId`
- **Exclusão:** `DeleteCalendarEventUseCase` verifica `event.createdBy === userId` OU `hasManagePermission` (permissão `calendar.events.manage`)
- **Convite de participantes:** `InviteParticipantsUseCase` verifica se o invitante tem papel `OWNER` no evento
- **Remoção de participantes:** `RemoveParticipantUseCase` verifica papel `OWNER`; o próprio OWNER não pode ser removido

### Regra 7: OWNER não responde ao próprio convite

`RespondToEventUseCase` bloqueia respostas RSVP de participantes com papel `OWNER`: `'Event owner cannot respond to their own event'`

### Regra 8: Lembretes são por usuário e por evento

`ManageRemindersUseCase` exige que o usuário seja participante do evento. A operação é idempotente: todos os lembretes existentes do usuário para aquele evento são deletados e recriados com a nova lista fornecida.

### Regra 9: Expansão de recorrência via RRULE

Ao listar eventos, eventos com `rrule` preenchido têm suas ocorrências expandidas dinamicamente para o intervalo solicitado usando o pacote `rrule`:

```typescript
const { RRule } = await import('rrule');
const rruleStr = event.rrule.replace(/^RRULE:/, '');
const options = RRule.parseString(rruleStr);
options.dtstart = event.startDate; // DTSTART = data original do evento
const rule = new RRule(options);
const occurrences = rule.between(startDate, endDate);
```

Se o parsing da RRULE falhar, o evento original é incluído sem expansão (fallback silencioso).

### Regra 10: Feriados brasileiros são eventos sintéticos

Ao listar eventos sem filtro de tipo específico (ou com `type = 'HOLIDAY'`) e sem `search`, feriados nacionais brasileiros são injetados na resposta como eventos não persistidos. Cada feriado recebe um UUID determinístico baseado em MD5 da string `holiday-YYYY-MM-DD`, garantindo estabilidade de ID entre requisições.

### Regra 11: Exclusão usa soft delete

Tanto calendários quanto eventos nunca são excluídos permanentemente. O campo `deletedAt` é preenchido com a data atual. Todas as consultas filtram automaticamente registros com `deletedAt IS NOT NULL`.

### Regra 12: Compartilhamento resolve acesso via resolveCalendarAccess

As operações de compartilhamento (`share-with-users`, `share-with-team`, `unshare`) verificam se o usuário tem `canShare = true` no calendário do evento, usando a função `resolveCalendarAccess` que considera o tipo de calendário e o papel do usuário na equipe.

---

## CalendarSyncService

O `CalendarSyncService` é o componente responsável por criar e manter eventos de sistema no calendário, integrado com outros módulos. Localização: `src/services/calendar/calendar-sync.service.ts`.

### Métodos disponíveis

| Método | Origem | Tipo de evento | systemSourceType |
|--------|--------|---------------|-----------------|
| `syncAbsence()` | Módulo RH — aprovação de ausência | `VACATION` ou `ABSENCE` | `HR_ABSENCE` |
| `syncBirthday()` | Módulo RH — criação/atualização de funcionário | `BIRTHDAY` + `rrule: 'FREQ=YEARLY'` | `HR_BIRTHDAY` |
| `syncFinanceEntry()` | Módulo Financeiro — criação de lançamento | `FINANCE_DUE` | `FINANCE_ENTRY` |
| `updateFinanceEventOnPayment()` | Módulo Financeiro — registro de pagamento | Atualiza título com prefixo `[Pago]`, `[Recebido]` ou `[Parcial]` | `FINANCE_ENTRY` |
| `syncPurchaseOrder()` | Módulo Estoque — criação de PO | `PURCHASE_ORDER` | `STOCK_PO` |
| `syncTaskDue()` | Módulo Tarefas — prazo de card | `TASK` | `TASK_DUE` |
| `removeSystemEvent()` | Cancelamento de ausência/PO | Soft delete do evento | qualquer |

### Comportamento de upsert

O `CalendarSyncService` verifica via `findBySystemSource(tenantId, sourceType, sourceId)` se já existe um evento para aquela entidade. Se sim, atualiza. Se não, cria. Falhas são logadas como `warn` e nunca propagam exceções ao chamador.

### Resolução de calendário alvo

O serviço tenta, em ordem de prioridade:
1. Calendário de sistema do módulo correspondente (`findSystemByModule`)
2. Calendário pessoal do usuário criador (`findPersonalByUser`)
3. Se nenhum for encontrado, loga `warn` e não persiste o evento

### Calendários de sistema provisionados

| systemModule | Nome | Cor |
|---|---|---|
| `HR` | Calendário RH | `#8b5cf6` |
| `FINANCE` | Calendário Financeiro | `#10b981` |
| `STOCK` | Calendário Estoque | `#f59e0b` |

Provisionados via `EnsureSystemCalendarsUseCase`, chamado na inicialização ou on-demand.

---

## Permissões

| Código | Constante | Descrição | Escopo |
|--------|-----------|-----------|--------|
| `calendar.events.create` | `CALENDAR.EVENTS.CREATE` | Criar eventos | tenant |
| `calendar.events.read` | `CALENDAR.EVENTS.READ` | Visualizar evento individual | tenant |
| `calendar.events.update` | `CALENDAR.EVENTS.UPDATE` | Atualizar eventos próprios | tenant |
| `calendar.events.delete` | `CALENDAR.EVENTS.DELETE` | Excluir eventos próprios | tenant |
| `calendar.events.list` | `CALENDAR.EVENTS.LIST` | Listar eventos no calendário | tenant |
| `calendar.events.manage` | `CALENDAR.EVENTS.MANAGE` | Excluir qualquer evento (admin) | tenant |
| `calendar.events.share-users` | `CALENDAR.EVENTS.SHARE_USERS` | Compartilhar com usuários | tenant |
| `calendar.events.share-teams` | `CALENDAR.EVENTS.SHARE_TEAMS` | Compartilhar com equipes | tenant |
| `calendar.events.export` | `CALENDAR.EVENTS.EXPORT` | Exportar para iCal | tenant |
| `calendar.participants.invite` | `CALENDAR.PARTICIPANTS.INVITE` | Convidar participantes | tenant |
| `calendar.participants.respond` | `CALENDAR.PARTICIPANTS.RESPOND` | Responder convite (RSVP) | tenant |
| `calendar.participants.manage` | `CALENDAR.PARTICIPANTS.MANAGE` | Remover participantes | tenant |
| `calendar.reminders.create` | `CALENDAR.REMINDERS.CREATE` | Criar e gerenciar lembretes | tenant |
| `calendar.reminders.delete` | `CALENDAR.REMINDERS.DELETE` | Deletar lembretes | tenant |

**Nota:** Os endpoints de gerenciamento de calendários (`/v1/calendar/calendars`) não utilizam `PermissionCodes` diretamente — o controle de acesso é feito via `resolveCalendarAccess` com base no tipo do calendário e papel do usuário na equipe.

---

## Data Model

```prisma
enum CalendarType  { PERSONAL TEAM SYSTEM }
enum EventType     { MEETING TASK REMINDER DEADLINE HOLIDAY BIRTHDAY VACATION ABSENCE FINANCE_DUE PURCHASE_ORDER CUSTOM }
enum EventVisibility { PUBLIC PRIVATE }
enum ParticipantRole  { OWNER ASSIGNEE GUEST }
enum ParticipantStatus { PENDING ACCEPTED DECLINED TENTATIVE }

model Calendar {
  id           String       @id @default(uuid())
  tenantId     String       @map("tenant_id")
  name         String       @db.VarChar(128)
  description  String?      @db.Text
  color        String?      @db.VarChar(7)
  type         CalendarType
  ownerId      String?      @map("owner_id") @db.VarChar(36)
  systemModule String?      @map("system_module") @db.VarChar(32)
  isDefault    Boolean      @default(false) @map("is_default")
  settings     Json         @default("{}")
  createdBy    String       @map("created_by")
  deletedAt    DateTime?    @map("deleted_at")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  @@unique([tenantId, ownerId, type, systemModule, deletedAt], name: "calendars_unique_active")
  @@index([tenantId])
  @@index([tenantId, type])
  @@index([ownerId])
  @@map("calendars")
}

model CalendarEvent {
  id               String          @id @default(uuid())
  tenantId         String          @map("tenant_id")
  calendarId       String          @map("calendar_id")
  title            String          @db.VarChar(256)
  description      String?         @db.Text
  location         String?         @db.VarChar(512)
  startDate        DateTime        @map("start_date")
  endDate          DateTime        @map("end_date")
  isAllDay         Boolean         @default(false) @map("is_all_day")
  type             EventType       @default(CUSTOM)
  visibility       EventVisibility @default(PUBLIC)
  color            String?         @db.VarChar(7)
  rrule            String?         @db.VarChar(512)
  timezone         String?         @db.VarChar(64)
  systemSourceType String?         @map("system_source_type")
  systemSourceId   String?         @map("system_source_id")
  metadata         Json            @default("{}")
  createdBy        String          @map("created_by")
  deletedAt        DateTime?       @map("deleted_at")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  @@index([tenantId, startDate, endDate])
  @@index([tenantId, calendarId])
  @@index([systemSourceType, systemSourceId])
  @@index([deletedAt])
  @@map("calendar_events")
}

model EventParticipant {
  id          String            @id @default(uuid())
  tenantId    String            @map("tenant_id")
  eventId     String            @map("event_id")
  userId      String            @map("user_id")
  role        ParticipantRole   @default(GUEST)
  status      ParticipantStatus @default(PENDING)
  respondedAt DateTime?         @map("responded_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  @@unique([eventId, userId])
  @@index([tenantId])
  @@index([eventId])
  @@index([userId])
  @@index([status])
  @@map("event_participants")
}

model EventReminder {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  eventId       String    @map("event_id")
  userId        String    @map("user_id")
  minutesBefore Int       @map("minutes_before")
  isSent        Boolean   @default(false) @map("is_sent")
  sentAt        DateTime? @map("sent_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  @@unique([eventId, userId, minutesBefore])
  @@index([tenantId])
  @@index([eventId])
  @@index([userId])
  @@index([isSent, eventId])
  @@map("event_reminders")
}

model TeamCalendarConfig {
  id         String @id @default(uuid())
  tenantId   String @map("tenant_id")
  teamId     String @map("team_id")
  calendarId String @map("calendar_id")
  -- Permissões por papel: owner/admin/member × read/create/edit/delete/share/manage
  -- Defaults: owner=tudo; admin=read/create/edit; member=read

  @@unique([teamId, calendarId])
  @@map("team_calendar_configs")
}
```

---

## Use Cases

### Events

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `CreateCalendarEventUseCase` | `events/create-calendar-event.ts` | Cria evento, adiciona criador como OWNER, valida calendário |
| `GetCalendarEventByIdUseCase` | `events/get-calendar-event-by-id.ts` | Busca evento com relações; aplica regra de privacidade |
| `ListCalendarEventsUseCase` | `events/list-calendar-events.ts` | Lista eventos no intervalo, expande RRULE, injeta feriados |
| `UpdateCalendarEventUseCase` | `events/update-calendar-event.ts` | Atualiza evento; bloqueia eventos de sistema e não-criadores |
| `DeleteCalendarEventUseCase` | `events/delete-calendar-event.ts` | Soft delete; bloqueia eventos de sistema |
| `InviteParticipantsUseCase` | `events/invite-participants.ts` | Convida usuários; envia notificação IN_APP + EMAIL |
| `RespondToEventUseCase` | `events/respond-to-event.ts` | RSVP do participante; notifica criador |
| `RemoveParticipantUseCase` | `events/remove-participant.ts` | Remove participante; notifica removido |
| `ShareEventWithUsersUseCase` | `events/share-event-with-users.ts` | Compartilha com lista de usuários via `resolveCalendarAccess` |
| `ShareEventWithTeamUseCase` | `events/share-event-with-team.ts` | Compartilha com todos os membros ativos de uma equipe |
| `UnshareEventUseCase` | `events/unshare-event.ts` | Remove acesso de um usuário (apenas GUESTs) |
| `ManageRemindersUseCase` | `events/manage-reminders.ts` | Substitui lembretes do usuário para o evento |
| `ProcessDueRemindersUseCase` | `events/process-due-reminders.ts` | Processa lembretes vencidos em batch, envia notificações |
| `ExportCalendarEventsUseCase` | `events/export-calendar-events.ts` | Gera arquivo `.ics` via `ical-generator` |

### Calendars

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `CreatePersonalCalendarUseCase` | `calendars/create-personal-calendar.ts` | Cria calendário pessoal (idempotente via `findOrCreatePersonal`) |
| `CreateTeamCalendarUseCase` | `calendars/create-team-calendar.ts` | Cria calendário de equipe com `TeamCalendarConfig` padrão |
| `GetCalendarByIdUseCase` | `calendars/get-calendar-by-id.ts` | Busca calendário com objeto de acesso resolvido |
| `ListMyCalendarsUseCase` | `calendars/list-my-calendars.ts` | Lista calendários pessoais + equipes do usuário |
| `UpdateCalendarUseCase` | `calendars/update-calendar.ts` | Atualiza metadados do calendário |
| `DeleteCalendarUseCase` | `calendars/delete-calendar.ts` | Soft delete de calendário (pessoais são imutáveis) |
| `UpdateTeamCalendarPermissionsUseCase` | `calendars/update-team-calendar-permissions.ts` | Atualiza `TeamCalendarConfig` de uma equipe |
| `EnsureSystemCalendarsUseCase` | `calendars/ensure-system-calendars.ts` | Garante existência dos calendários de sistema RH/Financeiro/Estoque |

---

## iCal Export

A exportação usa o pacote `ical-generator` e produz um arquivo RFC 5545 compatível com Google Calendar, Apple Calendar e Outlook.

**Características do arquivo gerado:**
- `PRODID`: `OpenSea/Calendar/PT-BR`
- `METHOD`: `PUBLISH`
- UID de cada evento: `{eventId}@opensea`
- Eventos com `visibility = 'PRIVATE'` têm `CLASS:PRIVATE` no iCal
- Eventos com `rrule` têm `RRULE:` adicionado à entrada
- Eventos com `timezone` têm `TZID` configurado
- Eventos privados de outros usuários são omitidos da exportação
- A exportação de um `calendarId` específico é restrita ao calendário pessoal do próprio usuário

---

## Repositories

### CalendarEventsRepository

| Método | Descrição |
|--------|-----------|
| `create(data)` | Cria evento com participantes e lembretes iniciais |
| `findById(id, tenantId)` | Busca por ID com isolamento de tenant |
| `findByIdWithRelations(id, tenantId)` | Busca evento com criador, participantes e lembretes |
| `findMany(options)` | Busca paginada sem relações |
| `findManyWithRelations(options)` | Busca paginada com relações (usado em listagem) |
| `findBySystemSource(tenantId, sourceType, sourceId)` | Busca evento de sistema por chave composta |
| `update(data)` | Atualiza campos parcialmente |
| `softDelete(id, tenantId)` | Marca `deletedAt = now()` |

### CalendarsRepository

| Método | Descrição |
|--------|-----------|
| `create(data)` | Cria calendário |
| `findById(id, tenantId)` | Busca por ID |
| `findPersonalByUser(userId, tenantId)` | Calendário pessoal do usuário |
| `findOrCreatePersonal(tenantId, userId)` | Idempotente: retorna ou cria calendário pessoal |
| `findByTeam(teamId, tenantId)` | Calendários da equipe |
| `findSystemByModule(module, tenantId)` | Calendário de sistema por módulo |
| `listByUser(userId, tenantId, teamIds)` | Todos os calendários visíveis ao usuário |
| `update(data)` | Atualiza metadados |
| `softDelete(id, tenantId)` | Soft delete |

---

## Tests

**Testes unitários:** 11 arquivos, 69 testes (todos passando)

| Arquivo | Cenários principais |
|---------|---------------------|
| `create-calendar-event.spec.ts` | Criação válida, criador como OWNER, validação de datas |
| `list-calendar-events.spec.ts` | Expansão de RRULE (semanal, anual, fallback inválido), injeção de feriados |
| `get-calendar-event-by-id.spec.ts` | Evento público, privado (criador), privado (não-participante → "Ocupado") |
| `update-calendar-event.spec.ts` | Atualização válida, bloqueio de evento de sistema, bloqueio de não-criador |
| `delete-calendar-event.spec.ts` | Soft delete válido, bloqueio de evento de sistema |
| `invite-participants.spec.ts` | Convite por OWNER, bloqueio de não-OWNER, skip de participantes já existentes |
| `respond-to-event.spec.ts` | RSVP ACCEPTED/DECLINED/TENTATIVE, bloqueio de OWNER |
| `remove-participant.spec.ts` | Remoção por OWNER, bloqueio de remoção de OWNER |
| `manage-reminders.spec.ts` | Substituição de lembretes, validação de participação |
| `export-calendar-events.spec.ts` | Geração de .ics, omissão de eventos privados de terceiros |
| `share-event-with-users.spec.ts` / `share-event-with-team.spec.ts` | Compartilhamento, verificação de `canShare` |

**Testes E2E:** 14+ arquivos em `src/http/controllers/calendar/`

| Arquivo | Cenários |
|---------|----------|
| `v1-create-calendar-event.e2e.spec.ts` | Criação, validações, auto-resolução de calendário |
| `v1-list-calendar-events.e2e.spec.ts` | Listagem, filtros, limite de 90 dias |
| `v1-get-calendar-event.e2e.spec.ts` | Busca, privacidade |
| `v1-update-calendar-event.e2e.spec.ts` | Atualização, restrições |
| `v1-delete-calendar-event.e2e.spec.ts` | Soft delete |
| `v1-invite-participants.e2e.spec.ts` | Convite de participantes |
| `v1-respond-to-event.e2e.spec.ts` | RSVP |
| `v1-remove-participant.e2e.spec.ts` | Remoção de participante |
| `v1-manage-reminders.e2e.spec.ts` | Gerenciamento de lembretes |
| `v1-process-due-reminders.e2e.spec.ts` | Processamento de lembretes vencidos |
| `v1-export-calendar-events.e2e.spec.ts` | Exportação iCal |
| `v1-export-personal-only.e2e.spec.ts` | Exportação restrita a calendário pessoal |
| `v1-share-event.e2e.spec.ts` | Compartilhamento com usuários e equipes |

**Factory de dados de teste:**
- `src/utils/tests/factories/calendar/create-calendar-test-data.e2e.ts`
- `createCalendarEvent(tenantId, createdBy, overrides?)` — cria evento + participante OWNER
- `createEventParticipant(eventId, userId, tenantId, options?)` — `tenantId` é o 3° parâmetro obrigatório

**Configuração de timeout E2E:**
- Timeout global: `30000ms`
- Hook timeout: `180000ms`
- Testes com 3+ criações de usuário têm timeout individual de `15000ms`

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Documentação inicial | — | Criado por doc-writer agent |
