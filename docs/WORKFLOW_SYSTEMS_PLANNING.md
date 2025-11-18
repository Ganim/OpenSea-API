# 🔄 Planejamento: Sistemas de Workflow (Requisições, Aprovações, Notificações e Calendário)

**Data de Criação:** 18 de novembro de 2025  
**Status:** 📋 Planejamento  
**Objetivo:** Sistemas genéricos e reutilizáveis para gestão de workflows empresariais

---

## 📋 Visão Geral

Implementação de 4 sistemas integrados e genéricos:

1. **Sistema de Requisições** - Solicitações genéricas entre usuários/grupos
2. **Sistema de Aprovações** - Fluxo de aprovação configurável com múltiplos níveis
3. **Sistema de Notificações** - Notificações internas e por e-mail
4. **Sistema de Calendário** - Eventos, lembretes e agendamentos

---

## 🎯 Requisitos de Negócio

### Sistema de Requisições

**Casos de Uso:**
- Requisitar acesso a uma funcionalidade/página
- Requisitar compra de material
- Requisitar aprovação de documento
- Requisitar ação de uma pessoa específica
- Requisitar para usuário individual ou grupo (gestor, setor)
- Requisitar alteração de dados sensíveis

**Requisitos:**
- ✅ Criar requisição para usuário específico ou grupo
- ✅ Adicionar anexos/arquivos à requisição
- ✅ Comentários e histórico de interações
- ✅ Prioridades (baixa, média, alta, urgente)
- ✅ Categorização por tipo
- ✅ SLA (Service Level Agreement) por categoria
- ✅ Encaminhamento/delegação de requisição
- ✅ Integração com sistema de aprovação

### Sistema de Aprovações

**Casos de Uso:**
- Aprovar documento (muda status)
- Aprovar inserção de registro (executa ação)
- Aprovar alteração de dados
- Aprovar compra (dispara workflow de compra)
- Fluxo multi-etapas (aprovação em cascata)
- Aprovação por votação (múltiplos aprovadores)

**Requisitos:**
- ✅ Fluxo de aprovação configurável (1 ou mais níveis)
- ✅ Aprovadores fixos ou dinâmicos (por cargo/grupo)
- ✅ Aprovação automática por regras
- ✅ Ações pós-aprovação (callbacks)
- ✅ Rejeição com motivo obrigatório
- ✅ **Devolução para solicitante** (solicitar informações/correções)
- ✅ Timeout de aprovação (auto-rejeita)
- ✅ Histórico completo de decisões
- ✅ Ciclos de ida e volta (aprovador → solicitante → aprovador)

### Sistema de Notificações

**Casos de Uso:**
- Nova requisição recebida
- Aprovação pendente
- Evento do calendário próximo
- Estoque baixo
- Alerta customizado disparado
- Relatório de meta atingida
- Lembrete de tarefa

**Requisitos:**
- ✅ Notificação interna (in-app)
- ✅ Notificação por e-mail
- ✅ Configuração de preferências por usuário
- ✅ Templates de notificação reutilizáveis
- ✅ Notificações em lote
- ✅ Agendamento de notificações
- ✅ Histórico de notificações enviadas
- ✅ Marcar como lida/não lida

### Sistema de Calendário

**Casos de Uso:**
- Eventos de reuniões
- Prazos de tarefas
- Agendamento de aprovações
- Eventos recorrentes
- Feriados e folgas
- Sincronização com calendários externos

**Requisitos:**
- ✅ CRUD de eventos
- ✅ Eventos recorrentes (diário, semanal, mensal)
- ✅ Participantes e convidados
- ✅ Notificação antes do evento
- ✅ Anexos em eventos
- ✅ Categorização por tipo
- ✅ Compartilhamento de calendários

---

## 🗄️ Modelagem de Dados

### 1. Sistema de Requisições

```prisma
enum RequestType {
  ACCESS_REQUEST       // Requisição de acesso
  PURCHASE_REQUEST     // Requisição de compra
  APPROVAL_REQUEST     // Requisição de aprovação
  ACTION_REQUEST       // Requisição de ação
  CHANGE_REQUEST       // Requisição de mudança
  CUSTOM               // Customizado
}

enum RequestStatus {
  DRAFT           // Rascunho
  SUBMITTED       // Submetida
  IN_PROGRESS     // Em progresso
  PENDING_INFO    // Aguardando informações
  APPROVED        // Aprovada
  REJECTED        // Rejeitada
  CANCELLED       // Cancelada
  COMPLETED       // Concluída
}

enum RequestPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RequestTargetType {
  USER   // Requisição para usuário específico
  GROUP  // Requisição para grupo (ex: gestores)
  ROLE   // Requisição para role (ADMIN, MANAGER)
}

model Request {
  id String @id @default(uuid())
  
  // Identificação
  title       String   @db.VarChar(200)
  description String   @db.Text
  type        RequestType
  category    String?  @db.VarChar(100)  // "purchase", "access", "hr", etc
  
  // Status e Prioridade
  status      RequestStatus   @default(SUBMITTED)
  priority    RequestPriority @default(MEDIUM)
  
  // Solicitante
  requesterId String @map("requester_id")
  requester   User   @relation("RequestsCreated", fields: [requesterId], references: [id])
  
  // Destinatário (pode ser usuário, grupo ou role)
  targetType  RequestTargetType @map("target_type")
  targetId    String?           @map("target_id")  // ID do usuário ou grupo
  targetRole  Role?             @map("target_role") // Se for por role
  
  // Atribuído a (responsável atual)
  assignedToId String? @map("assigned_to_id")
  assignedTo   User?   @relation("RequestsAssigned", fields: [assignedToId], references: [id])
  
  // SLA e Prazos
  dueDate     DateTime? @map("due_date")
  slaDeadline DateTime? @map("sla_deadline")
  
  // Dados flexíveis (JSON)
  metadata Json @default("{}")  // Dados específicos por tipo
  
  // Integração com Aprovação
  requiresApproval Boolean   @default(false) @map("requires_approval")
  approvalId       String?   @unique @map("approval_id")
  approval         Approval? @relation(fields: [approvalId], references: [id])
  
  // Timestamps
  submittedAt DateTime? @map("submitted_at")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  // Relations
  attachments RequestAttachment[]
  comments    RequestComment[]
  history     RequestHistory[]
  
  @@index([requesterId])
  @@index([assignedToId])
  @@index([status])
  @@index([type, category])
  @@index([dueDate])
  @@index([createdAt])
  @@map("requests")
}

model RequestAttachment {
  id String @id @default(uuid())
  
  requestId String  @map("request_id")
  request   Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  fileName     String   @map("file_name") @db.VarChar(255)
  filePath     String   @map("file_path") @db.VarChar(512)
  fileSize     Int      @map("file_size")
  mimeType     String   @map("mime_type") @db.VarChar(100)
  uploadedById String   @map("uploaded_by_id")
  uploadedBy   User     @relation("UploadedAttachments", fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now()) @map("created_at")
  
  @@index([requestId])
  @@map("request_attachments")
}

model RequestComment {
  id String @id @default(uuid())
  
  requestId String  @map("request_id")
  request   Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  authorId  String   @map("author_id")
  author    User     @relation("RequestComments", fields: [authorId], references: [id])
  content   String   @db.Text
  isInternal Boolean @default(false) @map("is_internal")  // Comentário interno (não visível para solicitante)
  
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  
  @@index([requestId])
  @@index([authorId])
  @@map("request_comments")
}

model RequestHistory {
  id String @id @default(uuid())
  
  requestId String  @map("request_id")
  request   Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  action      String   @db.VarChar(100)  // "created", "assigned", "status_changed", etc
  description String   @db.Text
  performedById String @map("performed_by_id")
  performedBy   User   @relation("RequestHistoryActions", fields: [performedById], references: [id])
  
  oldValue Json? @map("old_value")
  newValue Json? @map("new_value")
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([requestId])
  @@index([createdAt])
  @@map("request_history")
}
```

### 2. Sistema de Aprovações

```prisma
enum ApprovalStatus {
  PENDING            // Aguardando aprovação
  PENDING_INFO       // Aguardando informações do solicitante
  APPROVED           // Aprovado
  REJECTED           // Rejeitado
  CANCELLED          // Cancelado
  RETURNED           // Devolvido para correção
}

enum ApprovalType {
  SINGLE       // Aprovação única (1 aprovador)
  SEQUENTIAL   // Aprovação sequencial (múltiplos níveis)
  PARALLEL     // Aprovação paralela (todos aprovam ao mesmo tempo)
  VOTING       // Aprovação por votação (maioria aprova)
}

enum ApproverType {
  USER         // Aprovador específico
  ROLE         // Qualquer usuário com role
  GROUP        // Qualquer usuário do grupo de permissões
  DYNAMIC      // Aprovador determinado por regra
}

model Approval {
  id String @id @default(uuid())
  
  // Identificação
  title       String   @db.VarChar(200)
  description String?  @db.Text
  type        ApprovalType @default(SINGLE)
  
  // Status
  status ApprovalStatus @default(PENDING)
  
  // Solicitante
  requesterId String @map("requester_id")
  requester   User   @relation("ApprovalsRequested", fields: [requesterId], references: [id])
  
  // Entidade relacionada (genérico)
  entityType String  @map("entity_type") @db.VarChar(100)  // "request", "document", "purchase_order"
  entityId   String  @map("entity_id")                      // ID da entidade
  
  // Dados flexíveis
  metadata Json @default("{}")
  
  // Callback após aprovação/rejeição
  callbackUrl    String?  @map("callback_url") @db.VarChar(512)
  callbackAction String?  @map("callback_action") @db.VarChar(100)  // Ação a executar
  
  // Timeout
  expiresAt DateTime? @map("expires_at")
  
  // Timestamps
  approvedAt  DateTime? @map("approved_at")
  rejectedAt  DateTime? @map("rejected_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  // Relations
  steps    ApprovalStep[]
  history  ApprovalHistory[]
  request  Request?
  
  @@index([status])
  @@index([requesterId])
  @@index([entityType, entityId])
  @@index([expiresAt])
  @@map("approvals")
}

model ApprovalStep {
  id String @id @default(uuid())
  
  approvalId String   @map("approval_id")
  approval   Approval @relation(fields: [approvalId], references: [id], onDelete: Cascade)
  
  // Ordem do step (para aprovações sequenciais)
  stepOrder Int @map("step_order")
  
  // Aprovador
  approverType ApproverType @map("approver_type")
  approverId   String?      @map("approver_id")     // Se USER
  approverRole Role?        @map("approver_role")   // Se ROLE
  approverGroupId String?   @map("approver_group_id") // Se GROUP
  
  // Para votação
  requiredApprovals Int? @map("required_approvals")  // Quantidade necessária para aprovar
  
  // Status
  status     ApprovalStatus @default(PENDING)
  decidedById String?       @map("decided_by_id")
  decidedBy   User?         @relation("ApprovalDecisions", fields: [decidedById], references: [id])
  decision   String?        @db.VarChar(20)  // "approved", "rejected", "returned"
  comment    String?        @db.Text
  
  // Para devolução (solicitar informações)
  returnReason String? @map("return_reason") @db.Text  // Motivo da devolução
  returnedAt   DateTime? @map("returned_at")            // Quando foi devolvido
  
  // Timestamps
  decidedAt DateTime? @map("decided_at")
  createdAt DateTime  @default(now()) @map("created_at")
  
  // Relations
  votes ApprovalVote[]
  
  @@index([approvalId])
  @@index([status])
  @@index([approverId])
  @@map("approval_steps")
}

model ApprovalVote {
  id String @id @default(uuid())
  
  stepId String       @map("step_id")
  step   ApprovalStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
  
  voterId String @map("voter_id")
  voter   User   @relation("ApprovalVotes", fields: [voterId], references: [id])
  
  vote    String   @db.VarChar(20)  // "approved", "rejected"
  comment String?  @db.Text
  votedAt DateTime @default(now()) @map("voted_at")
  
  @@unique([stepId, voterId])
  @@index([stepId])
  @@map("approval_votes")
}

model ApprovalHistory {
  id String @id @default(uuid())
  
  approvalId String   @map("approval_id")
  approval   Approval @relation(fields: [approvalId], references: [id], onDelete: Cascade)
  
  action      String   @db.VarChar(100)
  description String   @db.Text
  performedById String @map("performed_by_id")
  performedBy   User   @relation("ApprovalHistoryActions", fields: [performedById], references: [id])
  
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([approvalId])
  @@map("approval_history")
}
```

### 3. Sistema de Notificações

```prisma
enum NotificationType {
  INFO       // Informativa
  WARNING    // Aviso
  ERROR      // Erro
  SUCCESS    // Sucesso
  REMINDER   // Lembrete
}

enum NotificationChannel {
  IN_APP     // Notificação interna
  EMAIL      // E-mail
  BOTH       // Ambos
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model Notification {
  id String @id @default(uuid())
  
  // Destinatário
  userId String @map("user_id")
  user   User   @relation("NotificationsReceived", fields: [userId], references: [id])
  
  // Conteúdo
  title   String @db.VarChar(200)
  message String @db.Text
  type    NotificationType @default(INFO)
  priority NotificationPriority @default(NORMAL)
  
  // Canal
  channel NotificationChannel @default(IN_APP)
  
  // Ação (link para onde ir ao clicar)
  actionUrl  String? @map("action_url") @db.VarChar(512)
  actionText String? @map("action_text") @db.VarChar(100)
  
  // Entidade relacionada (genérico)
  entityType String? @map("entity_type") @db.VarChar(100)
  entityId   String? @map("entity_id")
  
  // Dados adicionais
  metadata Json @default("{}")
  
  // Status
  isRead   Boolean   @default(false) @map("is_read")
  readAt   DateTime? @map("read_at")
  isSent   Boolean   @default(false) @map("is_sent")
  sentAt   DateTime? @map("sent_at")
  
  // Agendamento
  scheduledFor DateTime? @map("scheduled_for")
  
  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  
  @@index([userId, isRead])
  @@index([scheduledFor])
  @@index([createdAt])
  @@map("notifications")
}

model NotificationTemplate {
  id String @id @default(uuid())
  
  // Identificação
  code        String  @unique @db.VarChar(100)  // "new_request", "approval_pending"
  name        String  @db.VarChar(200)
  description String? @db.Text
  
  // Template
  titleTemplate   String @map("title_template") @db.VarChar(200)
  messageTemplate String @map("message_template") @db.Text
  
  // Configuração padrão
  defaultChannel   NotificationChannel @default(IN_APP) @map("default_channel")
  defaultPriority  NotificationPriority @default(NORMAL) @map("default_priority")
  
  // Status
  isActive Boolean @default(true) @map("is_active")
  
  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  
  @@map("notification_templates")
}

model NotificationPreference {
  id String @id @default(uuid())
  
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Preferências por canal
  enableInApp   Boolean @default(true) @map("enable_in_app")
  enableEmail   Boolean @default(true) @map("enable_email")
  
  // Preferências por tipo
  preferences Json @default("{}")  // { "request": { "inApp": true, "email": false }, ... }
  
  // Horários de silêncio (Do Not Disturb)
  silentHoursStart String? @map("silent_hours_start") @db.VarChar(5)  // "22:00"
  silentHoursEnd   String? @map("silent_hours_end") @db.VarChar(5)    // "08:00"
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@unique([userId])
  @@map("notification_preferences")
}
```

### 4. Sistema de Calendário

```prisma
enum EventType {
  MEETING      // Reunião
  TASK         // Tarefa
  DEADLINE     // Prazo
  REMINDER     // Lembrete
  HOLIDAY      // Feriado
  LEAVE        // Folga/Férias
  APPROVAL     // Aprovação agendada
  CUSTOM       // Customizado
}

enum EventRecurrence {
  NONE         // Sem recorrência
  DAILY        // Diário
  WEEKLY       // Semanal
  MONTHLY      // Mensal
  YEARLY       // Anual
  CUSTOM       // Customizado (cron expression)
}

enum EventStatus {
  SCHEDULED    // Agendado
  IN_PROGRESS  // Em progresso
  COMPLETED    // Concluído
  CANCELLED    // Cancelado
  RESCHEDULED  // Reagendado
}

model CalendarEvent {
  id String @id @default(uuid())
  
  // Identificação
  title       String @db.VarChar(200)
  description String? @db.Text
  type        EventType @default(CUSTOM)
  
  // Criador
  createdById String @map("created_by_id")
  createdBy   User   @relation("EventsCreated", fields: [createdById], references: [id])
  
  // Data/Hora
  startDate DateTime  @map("start_date")
  endDate   DateTime? @map("end_date")
  isAllDay  Boolean   @default(false) @map("is_all_day")
  
  // Localização
  location String? @db.VarChar(200)
  
  // Recorrência
  recurrence     EventRecurrence @default(NONE)
  recurrenceRule String?         @map("recurrence_rule") @db.VarChar(200)  // Cron ou RRULE
  
  // Status
  status EventStatus @default(SCHEDULED)
  
  // Notificações
  notifyBefore Int[] @map("notify_before")  // Minutos antes [15, 60, 1440]
  
  // Entidade relacionada (genérico)
  entityType String? @map("entity_type") @db.VarChar(100)
  entityId   String? @map("entity_id")
  
  // Dados flexíveis
  metadata Json @default("{}")
  
  // Timestamps
  completedAt DateTime? @map("completed_at")
  cancelledAt DateTime? @map("cancelled_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  // Relations
  participants EventParticipant[]
  attachments  EventAttachment[]
  reminders    EventReminder[]
  
  @@index([createdById])
  @@index([startDate, endDate])
  @@index([type, status])
  @@map("calendar_events")
}

model EventParticipant {
  id String @id @default(uuid())
  
  eventId String        @map("event_id")
  event   CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  userId String @map("user_id")
  user   User   @relation("EventParticipations", fields: [userId], references: [id])
  
  // Status de participação
  status String @db.VarChar(20)  // "invited", "accepted", "declined", "maybe"
  
  // Resposta
  respondedAt DateTime? @map("responded_at")
  comment     String?   @db.Text
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
  @@map("event_participants")
}

model EventAttachment {
  id String @id @default(uuid())
  
  eventId String        @map("event_id")
  event   CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  fileName String   @map("file_name") @db.VarChar(255)
  filePath String   @map("file_path") @db.VarChar(512)
  fileSize Int      @map("file_size")
  mimeType String   @map("mime_type") @db.VarChar(100)
  
  uploadedById String   @map("uploaded_by_id")
  uploadedBy   User     @relation("EventAttachmentsUploaded", fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now()) @map("created_at")
  
  @@index([eventId])
  @@map("event_attachments")
}

model EventReminder {
  id String @id @default(uuid())
  
  eventId String        @map("event_id")
  event   CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  userId String @map("user_id")
  user   User   @relation("EventReminders", fields: [userId], references: [id])
  
  // Lembrete
  remindAt DateTime  @map("remind_at")
  isSent   Boolean   @default(false) @map("is_sent")
  sentAt   DateTime? @map("sent_at")
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([eventId])
  @@index([userId, remindAt, isSent])
  @@map("event_reminders")
}
```

---

## 🔗 Integrações Entre Sistemas

### Request → Approval
- Requisição pode criar aprovação automaticamente
- Aprovação altera status da requisição

### Request → Notification
- Nova requisição notifica destinatário
- Mudança de status notifica solicitante

### Approval → Notification
- Aprovação pendente notifica aprovador
- Decisão notifica solicitante

### Calendar → Notification
- Lembrete de evento próximo
- Convite de evento notifica participantes

### Calendar → Approval
- Aprovação pode ter deadline no calendário

---

## 📊 Value Objects e Entidades

### Request Module
```typescript
// Value Objects
- RequestCode (formato: REQ-YYYY-NNNNNN)
- RequestSLA (cálculo de SLA por categoria)
- RequestMetadata (validação de metadata por tipo)

// Entities
- Request
- RequestAttachment
- RequestComment
- RequestHistory
```

### Approval Module
```typescript
// Value Objects
- ApprovalCode (formato: APR-YYYY-NNNNNN)
- ApprovalRule (regras de aprovação)

// Entities
- Approval
- ApprovalStep
- ApprovalVote
- ApprovalHistory
```

### Notification Module
```typescript
// Value Objects
- NotificationTemplate (interpolação de variáveis)
- NotificationSchedule (validação de agendamento)

// Entities
- Notification
- NotificationTemplate
- NotificationPreference
```

### Calendar Module
```typescript
// Value Objects
- EventDate (validação de data/hora)
- RecurrenceRule (parser de RRULE)

// Entities
- CalendarEvent
- EventParticipant
- EventAttachment
- EventReminder
```

---

## ⏭️ Próximos Passos

1. **Validar estrutura de dados** com stakeholders
2. **Criar migrations Prisma**
3. **Implementar entidades de domínio** (DDD)
4. **Criar repositórios** (interfaces + in-memory)
5. **Implementar casos de uso** por módulo
6. **Criar controllers e rotas REST**
7. **Implementar testes E2E**
8. **Documentação de API**

---

**Status:** ✅ Planejamento Inicial Completo  
**Próximo Documento:** Casos de Uso Detalhados
