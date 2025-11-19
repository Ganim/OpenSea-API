# 📋 Casos de Uso: Sistemas de Workflow

**Data de Criação:** 18 de novembro de 2025  
**Status:** 📘 Especificação  
**Baseado em:** WORKFLOW_SYSTEMS_PLANNING.md

---

## 🎯 Sistema de Requisições (20 casos de uso)

### 1. Criar Requisição (CreateRequestUseCase)
**Ator:** Usuário autenticado  
**Entrada:**
- `title`: Título da requisição
- `description`: Descrição detalhada
- `type`: Tipo (ACCESS_REQUEST, PURCHASE_REQUEST, etc)
- `category`: Categoria opcional
- `priority`: Prioridade (LOW, MEDIUM, HIGH, URGENT)
- `targetType`: USER, GROUP ou ROLE
- `targetId`: ID do usuário/grupo (se aplicável)
- `targetRole`: Role (se aplicável)
- `dueDate`: Prazo opcional
- `requiresApproval`: Se requer aprovação
- `metadata`: Dados flexíveis

**Saída:** Request criada com status SUBMITTED

**Regras:**
- Calcular SLA deadline baseado na categoria
- Se requiresApproval=true, criar Approval automaticamente
- Notificar destinatário(s)
- Registrar histórico

**Testes:**
- ✅ Criar requisição simples
- ✅ Criar requisição com aprovação
- ✅ Criar para usuário específico
- ✅ Criar para grupo
- ✅ Criar para role
- ✅ Validar campos obrigatórios
- ✅ Verificar notificação enviada

---

### 2. Listar Requisições (ListRequestsUseCase)
**Entrada:**
- `filters`: status, type, priority, assignedToId, requesterId
- `page`, `limit`

**Saída:** Lista paginada de requisições

**Regras:**
- Usuário comum vê apenas suas requisições (criadas ou atribuídas)
- ADMIN vê todas
- Ordenar por prioridade e data

**Testes:**
- ✅ Listar próprias requisições
- ✅ Filtrar por status
- ✅ Filtrar por tipo
- ✅ Admin vê todas
- ✅ Paginação

---

### 3. Obter Requisição por ID (GetRequestByIdUseCase)
**Entrada:** `requestId`  
**Saída:** Request completa com attachments, comments, history

**Regras:**
- Verificar permissão (criador, atribuído, ou ADMIN)

**Testes:**
- ✅ Obter requisição própria
- ✅ Admin obtém qualquer requisição
- ✅ Erro 404 se não existir
- ✅ Erro 403 sem permissão

---

### 4. Atualizar Requisição (UpdateRequestUseCase)
**Entrada:**
- `requestId`
- Campos a atualizar

**Regras:**
- Apenas criador ou ADMIN pode atualizar
- Não pode alterar se status = COMPLETED
- Registrar histórico

**Testes:**
- ✅ Atualizar título e descrição
- ✅ Não pode atualizar se completada
- ✅ Admin pode atualizar qualquer uma

---

### 5. Atribuir Requisição (AssignRequestUseCase)
**Entrada:**
- `requestId`
- `assignedToId`

**Regras:**
- Apenas destinatário do grupo ou ADMIN
- Notificar novo responsável
- Mudar status para IN_PROGRESS
- Registrar histórico

**Testes:**
- ✅ Atribuir requisição a usuário
- ✅ Notificar atribuído
- ✅ Status muda para IN_PROGRESS

---

### 6. Adicionar Comentário (AddRequestCommentUseCase)
**Entrada:**
- `requestId`
- `content`
- `isInternal`: Se é visível apenas para equipe

**Regras:**
- Notificar participantes (exceto autor)
- Registrar histórico

**Testes:**
- ✅ Adicionar comentário público
- ✅ Adicionar comentário interno
- ✅ Notificar participantes

---

### 7. Adicionar Anexo (AddRequestAttachmentUseCase)
**Entrada:**
- `requestId`
- `file`: Upload do arquivo

**Regras:**
- Validar tipo MIME
- Limite de tamanho (10MB)
- Salvar em storage

**Testes:**
- ✅ Upload de arquivo válido
- ✅ Rejeitar arquivo grande
- ✅ Rejeitar tipo inválido

---

### 8. Completar Requisição (CompleteRequestUseCase)
**Entrada:**
- `requestId`
- `comment`: Comentário final

**Regras:**
- Apenas atribuído ou ADMIN
- Mudar status para COMPLETED
- Notificar solicitante
- Registrar histórico

**Testes:**
- ✅ Completar requisição
- ✅ Notificar solicitante
- ✅ Não pode completar duas vezes

---

### 9. Cancelar Requisição (CancelRequestUseCase)
**Entrada:**
- `requestId`
- `reason`

**Regras:**
- Apenas criador ou ADMIN
- Mudar status para CANCELLED
- Se tiver aprovação, cancelar também

**Testes:**
- ✅ Cancelar requisição
- ✅ Cancela aprovação vinculada

---

### 10. Solicitar Informações (RequestInfoUseCase)
**Entrada:**
- `requestId`
- `message`: O que está faltando

**Regras:**
- Apenas atribuído pode solicitar
- Mudar status para PENDING_INFO
- Notificar solicitante
- Registrar histórico

**Testes:**
- ✅ Solicitar informações
- ✅ Status muda para PENDING_INFO
- ✅ Notificar solicitante

---

### 11. Fornecer Informações (ProvideInfoUseCase)
**Entrada:**
- `requestId`
- `response`: Informações fornecidas

**Regras:**
- Apenas criador pode responder
- Mudar status para SUBMITTED
- Notificar atribuído
- Registrar histórico

**Testes:**
- ✅ Fornecer informações
- ✅ Status volta para SUBMITTED

---

### 12-20. Casos de uso adicionais
- ListRequestHistory
- DeleteRequestComment
- DeleteRequestAttachment
- TransferRequest (reatribuir)
- EscalateRequest (escalar para superior)
- BulkUpdateRequests
- GetRequestMetrics
- ExportRequests
- SearchRequests

---

## ✅ Sistema de Aprovações (18 casos de uso)

### 1. Criar Aprovação (CreateApprovalUseCase)
**Entrada:**
- `title`, `description`
- `type`: SINGLE, SEQUENTIAL, PARALLEL, VOTING
- `entityType`, `entityId`: Entidade relacionada
- `steps`: Array de ApprovalStep
- `expiresAt`: Timeout opcional

**Saída:** Approval criada

**Regras:**
- Validar aprovadores
- Notificar aprovadores do primeiro step
- Registrar histórico

**Testes:**
- ✅ Criar aprovação simples (SINGLE)
- ✅ Criar aprovação sequencial
- ✅ Criar aprovação paralela
- ✅ Criar aprovação por votação
- ✅ Validar aprovadores existem

---

### 2. Aprovar Step (ApproveStepUseCase)
**Entrada:**
- `stepId`
- `comment`: Comentário opcional

**Regras:**
- Verificar se usuário é aprovador válido
- Marcar step como APPROVED
- Se tipo SEQUENTIAL, ativar próximo step
- Se tipo PARALLEL, verificar se todos aprovaram
- Se tipo VOTING, verificar quórum
- Se último step, aprovar a Approval
- Executar callback se definido
- Notificar solicitante
- Registrar histórico

**Testes:**
- ✅ Aprovar step único
- ✅ Aprovar step e ativar próximo (SEQUENTIAL)
- ✅ Aprovar todos steps (PARALLEL)
- ✅ Aprovar com quórum (VOTING)
- ✅ Executar callback após aprovação final
- ✅ Notificar solicitante

---

### 3. Rejeitar Step (RejectStepUseCase)
**Entrada:**
- `stepId`
- `reason`: Motivo obrigatório

**Regras:**
- Verificar se usuário é aprovador válido
- Marcar step como REJECTED
- Rejeitar toda a Approval
- Executar callback se definido
- Notificar solicitante
- Registrar histórico

**Testes:**
- ✅ Rejeitar step
- ✅ Rejeição cancela toda aprovação
- ✅ Motivo é obrigatório
- ✅ Notificar solicitante

---

### 4. Devolver para Correção (ReturnForCorrectionUseCase) ⭐
**Entrada:**
- `stepId`
- `returnReason`: O que precisa ser corrigido

**Regras:**
- Verificar se usuário é aprovador válido
- Marcar step como RETURNED
- Marcar Approval como PENDING_INFO
- Notificar solicitante com detalhes
- Registrar histórico com returnReason
- Quando solicitante corrigir, volta para PENDING

**Testes:**
- ✅ Devolver para correção
- ✅ Status muda para PENDING_INFO
- ✅ Notificar solicitante com motivo
- ✅ Pode reenviar após correção
- ✅ Histórico registra ida e volta

---

### 5. Resubmeter Após Correção (ResubmitAfterCorrectionUseCase)
**Entrada:**
- `approvalId`
- `changes`: Descrição do que foi corrigido

**Regras:**
- Apenas solicitante pode resubmeter
- Approval deve estar PENDING_INFO
- Volta para PENDING
- Notificar aprovador original
- Registrar histórico

**Testes:**
- ✅ Resubmeter após correção
- ✅ Status volta para PENDING
- ✅ Notificar aprovador

---

### 6. Votar em Step (VoteOnStepUseCase)
**Entrada:**
- `stepId`
- `vote`: "approved" ou "rejected"
- `comment`

**Regras:**
- Validar se é votação
- Verificar se usuário pode votar
- Não pode votar duas vezes
- Verificar quórum após voto
- Decidir step se quórum atingido

**Testes:**
- ✅ Votar em step
- ✅ Não pode votar duas vezes
- ✅ Quórum aprova step
- ✅ Falta de quórum rejeita

---

### 7. Obter Aprovação (GetApprovalByIdUseCase)
**Entrada:** `approvalId`  
**Saída:** Approval com steps e histórico

**Testes:**
- ✅ Obter aprovação
- ✅ Incluir steps e votos
- ✅ Erro 404 se não existir

---

### 8. Listar Aprovações Pendentes (ListPendingApprovalsUseCase)
**Entrada:** `userId`  
**Saída:** Aprovações onde usuário é aprovador

**Regras:**
- Filtrar por aprovador
- Ordenar por prioridade/prazo

**Testes:**
- ✅ Listar aprovações pendentes
- ✅ Filtrar por prazo próximo

---

### 9. Cancelar Aprovação (CancelApprovalUseCase)
**Entrada:** `approvalId`

**Regras:**
- Apenas solicitante ou ADMIN
- Mudar status para CANCELLED
- Notificar aprovadores

**Testes:**
- ✅ Cancelar aprovação
- ✅ Notificar aprovadores

---

### 10. Timeout de Aprovação (TimeoutApprovalUseCase)
**Entrada:** `approvalId` (job automático)

**Regras:**
- Executado por cron job
- Rejeitar automaticamente
- Notificar solicitante e aprovadores

**Testes:**
- ✅ Auto-rejeitar após timeout
- ✅ Notificar envolvidos

---

### 11-18. Casos de uso adicionais
- ListApprovalHistory
- DelegateApproval (delegar para outro aprovador)
- AddApprovalStep (adicionar step dinâmico)
- RemoveApprovalStep
- UpdateApprovalDeadline
- GetApprovalMetrics
- ExportApprovals
- BulkProcessApprovals

---

## 🔔 Sistema de Notificações (15 casos de uso)

### Implementação Atual (Resumo)
- Endpoints adicionados: envio manual (`POST /v1/notifications/:id/send`) e processamento agendado (`POST /v1/notifications/process-scheduled`).
- Worker periódico: `src/workers/notifications-scheduler.ts` usando `NOTIFICATIONS_CRON_INTERVAL_MS`.
- Preferências integradas: bloqueiam envio se `entityType` corresponder a `alertType` desabilitado no canal EMAIL.
- Use cases: `SendEmailNotificationUseCase`, `ProcessScheduledNotificationsUseCase` completos.
- Repositórios estendidos com `listScheduledPending`.


### 1. Criar Notificação (CreateNotificationUseCase)
**Entrada:**
- `userId`
- `title`, `message`
- `type`: INFO, WARNING, ERROR, SUCCESS, REMINDER
- `priority`: LOW, NORMAL, HIGH, URGENT
- `channel`: IN_APP, EMAIL, BOTH
- `actionUrl`, `actionText`
- `entityType`, `entityId`

**Saída:** Notification criada

**Regras:**
- Verificar preferências do usuário
- Se EMAIL, enfileirar para envio
- Se agendada, salvar scheduledFor

**Testes:**
- ✅ Criar notificação in-app
- ✅ Criar notificação email
- ✅ Respeitar preferências usuário
- ✅ Agendar notificação

---

### 2. Criar de Template (CreateFromTemplateUseCase)
**Entrada:**
- `templateCode`: Código do template
- `userId`
- `variables`: Variáveis para interpolação

**Regras:**
- Buscar template por código
- Interpolar variáveis no título/mensagem
- Usar configurações padrão do template

**Testes:**
- ✅ Criar de template
- ✅ Interpolar variáveis
- ✅ Erro se template não existe

---

### 3. Marcar como Lida (MarkAsReadUseCase)
**Entrada:** `notificationId`

**Regras:**
- Apenas dono da notificação
- Marcar isRead=true, readAt=now

**Testes:**
- ✅ Marcar como lida
- ✅ Não pode marcar notificação de outro

---

### 4. Marcar Todas como Lidas (MarkAllAsReadUseCase)
**Entrada:** `userId`

**Testes:**
- ✅ Marcar todas como lidas

---

### 5. Listar Notificações (ListNotificationsUseCase)
**Entrada:**
- `userId`
- `isRead`: Filtro opcional
- `type`: Filtro opcional

**Saída:** Lista de notificações

**Testes:**
- ✅ Listar todas
- ✅ Filtrar não lidas
- ✅ Filtrar por tipo

---

### 6. Deletar Notificação (DeleteNotificationUseCase)
**Entrada:** `notificationId`

**Regras:**
- Soft delete

**Testes:**
- ✅ Deletar notificação

---

### 7. Enviar Email (SendEmailNotificationUseCase)
**Entrada:** `notificationId`

**Regras:**
- Job worker que processa fila
- Usar EmailService existente
- Marcar isSent=true, sentAt=now

**Testes:**
- ✅ Enviar email
- ✅ Atualizar status após envio

---

### 8. Processar Agendadas (ProcessScheduledNotificationsUseCase)
**Entrada:** Job automático

**Regras:**
- Buscar notificações com scheduledFor <= now
- Enviar cada uma
- Cron job a cada minuto

**Testes:**
- ✅ Processar notificações agendadas

---

### 9. Gerenciar Preferências (UpdatePreferencesUseCase)
**Entrada:**
- `userId`
- `enableInApp`, `enableEmail`
- `preferences`: JSON com preferências por tipo
- `silentHoursStart`, `silentHoursEnd`

**Testes:**
- ✅ Atualizar preferências
- ✅ Desabilitar email
- ✅ Configurar horário silencioso

---

### 10. Obter Preferências (GetPreferencesUseCase)
**Entrada:** `userId`  
**Saída:** NotificationPreference

**Testes:**
- ✅ Obter preferências
- ✅ Criar padrão se não existir

---

### 11-15. Casos de uso adicionais
- CreateNotificationTemplate
- UpdateNotificationTemplate
- DeleteNotificationTemplate
- GetNotificationMetrics (não lidas, por tipo)
- BulkCreateNotifications

---

## 📅 Sistema de Calendário (16 casos de uso)

### 1. Criar Evento (CreateEventUseCase)
**Entrada:**
- `title`, `description`
- `type`: MEETING, TASK, DEADLINE, etc
- `startDate`, `endDate`, `isAllDay`
- `location`
- `recurrence`, `recurrenceRule`
- `notifyBefore`: Array de minutos
- `participantIds`: Array de usuários

**Saída:** CalendarEvent criado

**Regras:**
- Validar datas (start < end)
- Criar EventParticipant para cada participante
- Criar EventReminder baseado em notifyBefore
- Notificar participantes

**Testes:**
- ✅ Criar evento simples
- ✅ Criar evento all-day
- ✅ Criar evento recorrente
- ✅ Adicionar participantes
- ✅ Validar datas

---

### 2. Atualizar Evento (UpdateEventUseCase)
**Entrada:**
- `eventId`
- Campos a atualizar

**Regras:**
- Apenas criador ou ADMIN
- Se alterar data, notificar participantes
- Registrar alteração

**Testes:**
- ✅ Atualizar evento
- ✅ Notificar ao alterar data

---

### 3. Cancelar Evento (CancelEventUseCase)
**Entrada:**
- `eventId`
- `reason`

**Regras:**
- Apenas criador ou ADMIN
- Mudar status para CANCELLED
- Notificar participantes

**Testes:**
- ✅ Cancelar evento
- ✅ Notificar participantes

---

### 4. Responder Convite (RespondToEventUseCase)
**Entrada:**
- `eventId`
- `response`: "accepted", "declined", "maybe"
- `comment`

**Regras:**
- Atualizar EventParticipant
- Notificar criador do evento

**Testes:**
- ✅ Aceitar convite
- ✅ Recusar convite
- ✅ Responder maybe

---

### 5. Listar Eventos (ListEventsUseCase)
**Entrada:**
- `userId`
- `startDate`, `endDate`: Range de datas
- `type`, `status`: Filtros

**Saída:** Lista de eventos

**Regras:**
- Retornar eventos criados ou onde é participante
- Expandir recorrências no período

**Testes:**
- ✅ Listar eventos do mês
- ✅ Filtrar por tipo
- ✅ Expandir recorrências

---

### 6. Adicionar Anexo (AddEventAttachmentUseCase)
**Entrada:**
- `eventId`
- `file`

**Testes:**
- ✅ Adicionar anexo

---

### 7. Adicionar Participante (AddEventParticipantUseCase)
**Entrada:**
- `eventId`
- `userId`

**Regras:**
- Notificar novo participante

**Testes:**
- ✅ Adicionar participante
- ✅ Notificar

---

### 8. Remover Participante (RemoveEventParticipantUseCase)
**Entrada:**
- `eventId`
- `userId`

**Testes:**
- ✅ Remover participante

---

### 9. Processar Lembretes (ProcessEventRemindersUseCase)
**Entrada:** Job automático

**Regras:**
- Buscar reminders com remindAt <= now e isSent=false
- Enviar notificação
- Marcar como enviado
- Cron job a cada minuto

**Testes:**
- ✅ Processar lembretes
- ✅ Marcar como enviado

---

### 10. Completar Evento (CompleteEventUseCase)
**Entrada:** `eventId`

**Regras:**
- Mudar status para COMPLETED
- Apenas para TASKs e DEADLINEs

**Testes:**
- ✅ Completar tarefa

---

### 11-16. Casos de uso adicionais
- GetEventById
- DeleteEvent (soft delete)
- SearchEvents
- GetEventConflicts (verificar conflitos de horário)
- ExportEvents (iCal format)
- SyncExternalCalendar

---

## 📊 Resumo de Casos de Uso

| Sistema | Casos de Uso | Complexidade |
|---------|--------------|--------------|
| Requisições | 20 | Média |
| Aprovações | 18 | Alta |
| Notificações | 15 | Média |
| Calendário | 16 | Média |
| **TOTAL** | **69** | - |

---

## 🔗 Fluxos Integrados

### Fluxo 1: Requisição com Aprovação
```
1. CreateRequestUseCase (requiresApproval=true)
   → Cria Request
   → CreateApprovalUseCase (automático)
   → CreateNotificationUseCase (notifica aprovador)

2. ApproveStepUseCase
   → Atualiza Approval
   → UpdateRequestUseCase (status=APPROVED)
   → CreateNotificationUseCase (notifica solicitante)
```

### Fluxo 2: Aprovação com Devolução
```
1. ReturnForCorrectionUseCase
   → Atualiza ApprovalStep (status=RETURNED)
   → Atualiza Approval (status=PENDING_INFO)
   → CreateNotificationUseCase (notifica solicitante)

2. ResubmitAfterCorrectionUseCase
   → Atualiza Approval (status=PENDING)
   → CreateNotificationUseCase (notifica aprovador)

3. ApproveStepUseCase (após correção)
   → Continua fluxo normal
```

### Fluxo 3: Evento com Lembrete
```
1. CreateEventUseCase
   → Cria CalendarEvent
   → Cria EventReminder
   → CreateNotificationUseCase (notifica participantes)

2. ProcessEventRemindersUseCase (cron)
   → CreateNotificationUseCase (lembrete)
```

---

**Status:** ✅ Casos de Uso Especificados  
**Total de Testes Estimados:** ~250 testes unitários  
**Próximo Documento:** Roadmap de Implementação
