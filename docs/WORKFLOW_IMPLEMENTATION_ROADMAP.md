# 🗺️ Roadmap de Implementação: Sistemas de Workflow

**Data de Criação:** 18 de novembro de 2025  
**Status:** 📋 Plano de Execução  
**Baseado em:** WORKFLOW_SYSTEMS_PLANNING.md + WORKFLOW_USE_CASES.md

---

## 📊 Visão Geral

### Escopo Total
- **4 Sistemas:** Requisições, Aprovações, Notificações, Calendário
- **19 Tabelas:** Prisma schema completo
- **69 Casos de Uso:** Implementação completa
- **~250 Testes:** Cobertura unitária + E2E
- **Duração Estimada:** 4-6 meses (20-25 sprints)

### Ordem de Implementação
1. **Notificações** (fundação para alertas)
2. **Requisições** (sistema base)
3. **Aprovações** (depende de Requisições e Notificações)
4. **Calendário** (integrações finais)

---

## 🎯 FASE 1: Sistema de Notificações (3 sprints)

**Por que primeiro?** Todos os outros sistemas dependem de notificações.

### Sprint 1: Fundação de Notificações (1 semana)
**Objetivo:** Estrutura básica funcionando

#### Dia 1-2: Schema e Migrations
- [ ] Criar migration para tabelas Notification
- [ ] Criar migration para NotificationTemplate
- [ ] Criar migration para NotificationPreference
- [ ] Rodar migrations e testar
- [ ] Criar seed com templates padrão

**Entregáveis:**
- ✅ Migrations rodando
- ✅ 3 tabelas criadas
- ✅ Enums configurados

#### Dia 3-4: Entities e Value Objects
```typescript
// Criar arquivos:
src/entities/notifications/notification.ts
src/entities/notifications/notification-template.ts
src/entities/notifications/notification-preference.ts
src/entities/notifications/value-objects/notification-type.ts
src/entities/notifications/value-objects/notification-channel.ts
```

**Testes:** ~15 testes unitários

#### Dia 5: Repositories
```typescript
// Criar arquivos:
src/repositories/notifications/notification-repository.ts (interface)
src/repositories/notifications/in-memory-notification-repository.ts
src/repositories/notifications/prisma-notification-repository.ts
```

**Testes:** ~10 testes

**Entregáveis Sprint 1:**
- ✅ Migrations funcionando
- ✅ Entities completas
- ✅ Repositories implementados
- ✅ ~25 testes passando

---

### Sprint 2: Use Cases Principais (1 semana)
**Objetivo:** Fluxo CRUD completo

#### Casos de Uso a Implementar
1. `CreateNotificationUseCase`
2. `CreateFromTemplateUseCase`
3. `MarkAsReadUseCase`
4. `MarkAllAsReadUseCase`
5. `ListNotificationsUseCase`
6. `DeleteNotificationUseCase`

**Arquivos:**
```
src/use-cases/notifications/create-notification.ts
src/use-cases/notifications/create-from-template.ts
src/use-cases/notifications/mark-as-read.ts
src/use-cases/notifications/mark-all-as-read.ts
src/use-cases/notifications/list-notifications.ts
src/use-cases/notifications/delete-notification.ts
```

**Testes:** ~40 testes unitários

**Entregáveis Sprint 2:**
- ✅ 6 use cases implementados
- ✅ ~40 testes passando
- ✅ Sistema CRUD funcional

---

### Sprint 3: Controllers, Workers e Preferências (1 semana)
**Objetivo:** API completa + Email worker

#### Dia 1-2: Controllers e Routes
```typescript
// Criar arquivos:
src/http/controllers/notifications/create-notification.controller.ts
src/http/controllers/notifications/list-notifications.controller.ts
src/http/controllers/notifications/mark-as-read.controller.ts
src/http/controllers/notifications/update-preferences.controller.ts

// Schemas Zod:
src/http/schemas/notification-schemas.ts

// Routes:
src/http/routes/notification-routes.ts
```

#### Dia 3: Email Worker
```typescript
// Criar arquivos:
src/use-cases/notifications/send-email-notification.ts
src/use-cases/notifications/process-scheduled-notifications.ts

// Background job (opcional: usar node-cron ou bull):
src/workers/notification-worker.ts
```

#### Dia 4: Preferências
```typescript
src/use-cases/notifications/update-preferences.ts
src/use-cases/notifications/get-preferences.ts
```

#### Dia 5: Testes E2E
```
test/e2e/notifications/create-notification.e2e-spec.ts
test/e2e/notifications/list-notifications.e2e-spec.ts
test/e2e/notifications/mark-as-read.e2e-spec.ts
test/e2e/notifications/preferences.e2e-spec.ts
```

**Testes:** ~30 testes E2E

**Entregáveis Sprint 3:**
- ✅ API REST completa
- ✅ Email worker funcionando
- ✅ Sistema de preferências
- ✅ ~30 testes E2E
- ✅ **Sistema de Notificações 100% funcional** 🎉

---

## 📋 FASE 2: Sistema de Requisições (5 sprints)

### Sprint 4: Fundação de Requisições (1 semana)

#### Schema e Migrations
- [ ] Migration para Request
- [ ] Migration para RequestAttachment
- [ ] Migration para RequestComment
- [ ] Migration para RequestHistory
- [ ] Seed com categorias padrão

#### Entities
```typescript
src/entities/requests/request.ts
src/entities/requests/request-attachment.ts
src/entities/requests/request-comment.ts
src/entities/requests/request-history.ts
src/entities/requests/value-objects/request-type.ts
src/entities/requests/value-objects/request-status.ts
src/entities/requests/value-objects/request-priority.ts
```

#### Repositories
```typescript
src/repositories/requests/request-repository.ts
src/repositories/requests/in-memory-request-repository.ts
src/repositories/requests/prisma-request-repository.ts
```

**Testes:** ~30 testes

**Entregáveis Sprint 4:**
- ✅ 4 tabelas criadas
- ✅ Entities completas
- ✅ Repositories implementados

---

### Sprint 5: Use Cases Principais (1 semana)

#### Casos de Uso
1. `CreateRequestUseCase` ⭐ (integra com Notificações)
2. `ListRequestsUseCase`
3. `GetRequestByIdUseCase`
4. `UpdateRequestUseCase`
5. `AssignRequestUseCase` ⭐ (notifica atribuído)
6. `CompleteRequestUseCase` ⭐ (notifica solicitante)
7. `CancelRequestUseCase`

**Integração com Notificações:**
```typescript
// No CreateRequestUseCase:
await this.createNotificationUseCase.execute({
  userId: targetId,
  title: 'Nova Requisição',
  message: `Você tem uma nova requisição: ${title}`,
  type: 'INFO',
  channel: 'BOTH',
  entityType: 'REQUEST',
  entityId: request.id
})
```

**Testes:** ~50 testes

**Entregáveis Sprint 5:**
- ✅ 7 use cases principais
- ✅ Integração com Notificações testada
- ✅ ~50 testes passando

---

### Sprint 6: Comentários e Anexos (1 semana)

#### Casos de Uso
1. `AddRequestCommentUseCase` ⭐ (notifica participantes)
2. `AddRequestAttachmentUseCase`
3. `DeleteRequestCommentUseCase`
4. `DeleteRequestAttachmentUseCase`

#### Upload de Arquivos
```typescript
// Configurar multer/fastify-multipart:
src/lib/file-upload.ts

// Storage (local ou S3):
src/services/storage-service.ts
```

**Testes:** ~25 testes

**Entregáveis Sprint 6:**
- ✅ Sistema de comentários
- ✅ Upload de anexos funcionando
- ✅ Notificações de comentários

---

### Sprint 7: Fluxo de Informações (1 semana)

#### Casos de Uso
1. `RequestInfoUseCase` ⭐ (muda status para PENDING_INFO)
2. `ProvideInfoUseCase` ⭐ (volta para SUBMITTED)
3. `ListRequestHistoryUseCase`

#### Implementação do Ciclo
```typescript
// RequestInfoUseCase:
request.requestInfo() // method no entity
request.changeStatus('PENDING_INFO')
await notifyRequester()

// ProvideInfoUseCase:
request.provideInfo(response)
request.changeStatus('SUBMITTED')
await notifyAssigned()
```

**Testes:** ~20 testes

**Entregáveis Sprint 7:**
- ✅ Ciclo de informações funcionando
- ✅ Histórico de mudanças
- ✅ Status transitions validadas

---

### Sprint 8: Controllers, Routes e E2E (1 semana)

#### Controllers
```typescript
src/http/controllers/requests/create-request.controller.ts
src/http/controllers/requests/list-requests.controller.ts
src/http/controllers/requests/get-request.controller.ts
src/http/controllers/requests/update-request.controller.ts
src/http/controllers/requests/assign-request.controller.ts
src/http/controllers/requests/add-comment.controller.ts
src/http/controllers/requests/add-attachment.controller.ts
src/http/controllers/requests/request-info.controller.ts
src/http/controllers/requests/complete-request.controller.ts
```

#### Schemas Zod
```typescript
src/http/schemas/request-schemas.ts
```

#### Routes
```typescript
src/http/routes/request-routes.ts
```

#### Testes E2E (Críticos)
```typescript
test/e2e/requests/create-request.e2e-spec.ts
test/e2e/requests/assign-request.e2e-spec.ts
test/e2e/requests/request-info-cycle.e2e-spec.ts // ⭐ Ciclo completo
test/e2e/requests/complete-request.e2e-spec.ts
test/e2e/requests/comments-and-attachments.e2e-spec.ts
```

**Testes:** ~40 testes E2E

**Entregáveis Sprint 8:**
- ✅ API REST completa
- ✅ ~40 testes E2E
- ✅ **Sistema de Requisições 100% funcional** 🎉

---

## ✅ FASE 3: Sistema de Aprovações (6 sprints)

**Complexidade:** Alta (fluxos complexos + votação + devolução)

### Sprint 9: Fundação de Aprovações (1 semana)

#### Schema e Migrations
- [ ] Migration para Approval
- [ ] Migration para ApprovalStep (com returnReason/returnedAt)
- [ ] Migration para ApprovalVote
- [ ] Migration para ApprovalHistory

#### Entities (Complexas)
```typescript
src/entities/approvals/approval.ts
  // Métodos: start(), approve(), reject(), return(), cancel()
  
src/entities/approvals/approval-step.ts
  // Métodos: approve(), reject(), return(), vote()
  
src/entities/approvals/approval-vote.ts

src/entities/approvals/value-objects/approval-type.ts
  // SINGLE, SEQUENTIAL, PARALLEL, VOTING

src/entities/approvals/value-objects/approval-status.ts
  // PENDING, PENDING_INFO, APPROVED, REJECTED, RETURNED
```

#### Repositories
```typescript
src/repositories/approvals/approval-repository.ts
src/repositories/approvals/in-memory-approval-repository.ts
src/repositories/approvals/prisma-approval-repository.ts
```

**Testes:** ~35 testes (entities complexas)

**Entregáveis Sprint 9:**
- ✅ 4 tabelas criadas
- ✅ Entities com lógica de negócio
- ✅ Repositories implementados

---

### Sprint 10: Aprovação Simples e Sequencial (1 semana)

#### Casos de Uso
1. `CreateApprovalUseCase` ⭐ (integra com Notificações)
2. `ApproveStepUseCase` ⭐ (lógica sequencial)
3. `RejectStepUseCase`
4. `GetApprovalByIdUseCase`
5. `ListPendingApprovalsUseCase`

#### Lógica Sequencial
```typescript
// ApproveStepUseCase:
currentStep.approve()

if (approval.type === 'SEQUENTIAL') {
  const nextStep = approval.getNextStep()
  if (nextStep) {
    nextStep.activate()
    await notifyApprovers(nextStep)
  } else {
    approval.complete() // último step
    await executeCallback()
  }
}
```

**Testes:** ~40 testes

**Entregáveis Sprint 10:**
- ✅ Aprovação SINGLE funcionando
- ✅ Aprovação SEQUENTIAL funcionando
- ✅ Notificações integradas

---

### Sprint 11: Aprovação Paralela (1 semana)

#### Caso de Uso
1. `ApproveStepUseCase` (expandir para PARALLEL)

#### Lógica Paralela
```typescript
// ApproveStepUseCase:
if (approval.type === 'PARALLEL') {
  currentStep.approve()
  
  const allSteps = approval.getAllSteps()
  const allApproved = allSteps.every(s => s.status === 'APPROVED')
  
  if (allApproved) {
    approval.complete()
    await executeCallback()
  }
}
```

**Testes:** ~20 testes

**Entregáveis Sprint 11:**
- ✅ Aprovação PARALLEL funcionando
- ✅ Lógica de "todos aprovarem"

---

### Sprint 12: Votação com Quórum (1 semana)

#### Casos de Uso
1. `VoteOnStepUseCase`
2. `ApproveStepUseCase` (expandir para VOTING)

#### Lógica de Votação
```typescript
// VoteOnStepUseCase:
const vote = ApprovalVote.create({
  stepId,
  approverId,
  vote: 'approved', // ou 'rejected'
  comment
})

await this.approvalVoteRepository.create(vote)

// Verificar quórum:
const votes = await this.approvalVoteRepository.findByStepId(stepId)
const totalVotes = votes.length
const approvedVotes = votes.filter(v => v.vote === 'approved').length
const rejectedVotes = votes.filter(v => v.vote === 'rejected').length

const approvalPercentage = (approvedVotes / totalVotes) * 100
const requiredPercentage = step.requiredApprovers || 50

if (approvalPercentage >= requiredPercentage) {
  await this.approveStepUseCase.execute({ stepId })
} else if ((rejectedVotes / totalVotes) * 100 > (100 - requiredPercentage)) {
  await this.rejectStepUseCase.execute({ stepId, reason: 'Quórum não atingido' })
}
```

**Testes:** ~30 testes

**Entregáveis Sprint 12:**
- ✅ Sistema de votação completo
- ✅ Cálculo de quórum funcionando
- ✅ Aprovação VOTING funcionando

---

### Sprint 13: Devolução e Resubmissão (1 semana) ⭐

#### Casos de Uso
1. `ReturnForCorrectionUseCase` ⭐⭐⭐
2. `ResubmitAfterCorrectionUseCase` ⭐⭐⭐

#### Lógica de Devolução
```typescript
// ReturnForCorrectionUseCase:
step.return(returnReason)
step.markReturnedAt(new Date())
approval.changeStatus('PENDING_INFO')

await this.approvalRepository.save(approval)

// Notificar solicitante:
await this.createNotificationUseCase.execute({
  userId: approval.requesterId,
  title: 'Aprovação Devolvida',
  message: `Sua aprovação foi devolvida: ${returnReason}`,
  type: 'WARNING',
  priority: 'HIGH',
  actionUrl: `/approvals/${approval.id}`,
  actionText: 'Corrigir e Reenviar'
})

// Registrar histórico:
await this.approvalHistoryRepository.create({
  approvalId: approval.id,
  action: 'RETURNED',
  performedBy: approverId,
  details: returnReason
})
```

```typescript
// ResubmitAfterCorrectionUseCase:
if (approval.status !== 'PENDING_INFO') {
  throw new BadRequestError('Aprovação não está aguardando correção')
}

approval.changeStatus('PENDING')
step.resetForReview()

await this.approvalRepository.save(approval)

// Notificar aprovador:
await this.createNotificationUseCase.execute({
  userId: step.approverId,
  title: 'Aprovação Resubmetida',
  message: `Correções foram feitas: ${changes}`,
  type: 'INFO',
  actionUrl: `/approvals/${approval.id}`
})

// Registrar histórico:
await this.approvalHistoryRepository.create({
  approvalId: approval.id,
  action: 'RESUBMITTED',
  performedBy: approval.requesterId,
  details: changes
})
```

#### Testes (Críticos) ⭐⭐⭐
```typescript
// Testar ciclo completo:
test('should return approval for correction and resubmit', async () => {
  // 1. Criar aprovação
  const approval = await createApprovalUseCase.execute(...)
  
  // 2. Devolver para correção
  await returnForCorrectionUseCase.execute({
    stepId: approval.steps[0].id,
    returnReason: 'Falta documento X'
  })
  
  expect(approval.status).toBe('PENDING_INFO')
  
  // 3. Resubmeter após correção
  await resubmitAfterCorrectionUseCase.execute({
    approvalId: approval.id,
    changes: 'Documento X anexado'
  })
  
  expect(approval.status).toBe('PENDING')
  
  // 4. Aprovar após correção
  await approveStepUseCase.execute({
    stepId: approval.steps[0].id
  })
  
  expect(approval.status).toBe('APPROVED')
})
```

**Testes:** ~30 testes (incluindo ciclo completo)

**Entregáveis Sprint 13:**
- ✅ Devolução funcionando
- ✅ Resubmissão funcionando
- ✅ Ciclo de ida e volta completo ⭐
- ✅ Histórico registrado

---

### Sprint 14: Controllers, Routes e E2E (1 semana)

#### Controllers
```typescript
src/http/controllers/approvals/create-approval.controller.ts
src/http/controllers/approvals/approve-step.controller.ts
src/http/controllers/approvals/reject-step.controller.ts
src/http/controllers/approvals/return-for-correction.controller.ts
src/http/controllers/approvals/resubmit-after-correction.controller.ts
src/http/controllers/approvals/vote-on-step.controller.ts
src/http/controllers/approvals/list-pending-approvals.controller.ts
src/http/controllers/approvals/get-approval.controller.ts
```

#### Schemas
```typescript
src/http/schemas/approval-schemas.ts
```

#### Routes
```typescript
src/http/routes/approval-routes.ts
```

#### Testes E2E (Críticos) ⭐⭐⭐
```typescript
test/e2e/approvals/single-approval.e2e-spec.ts
test/e2e/approvals/sequential-approval.e2e-spec.ts
test/e2e/approvals/parallel-approval.e2e-spec.ts
test/e2e/approvals/voting-approval.e2e-spec.ts
test/e2e/approvals/return-and-resubmit.e2e-spec.ts // ⭐⭐⭐ Mais importante
test/e2e/approvals/approval-timeout.e2e-spec.ts
```

**Testes:** ~50 testes E2E

**Entregáveis Sprint 14:**
- ✅ API REST completa
- ✅ ~50 testes E2E
- ✅ **Sistema de Aprovações 100% funcional** 🎉
- ✅ **Ciclo de devolução validado** ⭐

---

## 📅 FASE 4: Sistema de Calendário (5 sprints)

### Sprint 15: Fundação do Calendário (1 semana)

#### Schema e Migrations
- [ ] Migration para CalendarEvent
- [ ] Migration para EventParticipant
- [ ] Migration para EventAttachment
- [ ] Migration para EventReminder

#### Entities
```typescript
src/entities/calendar/calendar-event.ts
src/entities/calendar/event-participant.ts
src/entities/calendar/event-reminder.ts
src/entities/calendar/value-objects/event-type.ts
src/entities/calendar/value-objects/event-recurrence.ts
```

#### Repositories
```typescript
src/repositories/calendar/calendar-event-repository.ts
src/repositories/calendar/in-memory-calendar-event-repository.ts
src/repositories/calendar/prisma-calendar-event-repository.ts
```

**Testes:** ~30 testes

---

### Sprint 16: Use Cases Principais (1 semana)

#### Casos de Uso
1. `CreateEventUseCase` ⭐ (notifica participantes)
2. `UpdateEventUseCase`
3. `CancelEventUseCase` ⭐ (notifica participantes)
4. `ListEventsUseCase`
5. `GetEventByIdUseCase`

**Testes:** ~35 testes

---

### Sprint 17: Participantes e Respostas (1 semana)

#### Casos de Uso
1. `AddEventParticipantUseCase`
2. `RemoveEventParticipantUseCase`
3. `RespondToEventUseCase` (accept/decline/maybe)

**Testes:** ~20 testes

---

### Sprint 18: Recorrência e Lembretes (1 semana)

#### Lógica de Recorrência
```typescript
// Usar biblioteca rrule:
import { RRule } from 'rrule'

// No CreateEventUseCase:
if (recurrence && recurrenceRule) {
  const rule = RRule.fromString(recurrenceRule)
  // Calcular próximas ocorrências
}
```

#### Worker de Lembretes
```typescript
src/use-cases/calendar/process-event-reminders.ts

// Cron job a cada minuto:
src/workers/reminder-worker.ts
```

**Testes:** ~25 testes

---

### Sprint 19: Controllers, Routes e E2E (1 semana)

#### Controllers + Routes
```typescript
src/http/controllers/calendar/create-event.controller.ts
src/http/controllers/calendar/update-event.controller.ts
src/http/controllers/calendar/cancel-event.controller.ts
src/http/controllers/calendar/respond-to-event.controller.ts
src/http/controllers/calendar/list-events.controller.ts
src/http/routes/calendar-routes.ts
```

#### Testes E2E
```typescript
test/e2e/calendar/create-event.e2e-spec.ts
test/e2e/calendar/recurring-events.e2e-spec.ts
test/e2e/calendar/event-reminders.e2e-spec.ts
test/e2e/calendar/respond-to-event.e2e-spec.ts
```

**Testes:** ~30 testes E2E

**Entregáveis Sprint 19:**
- ✅ API REST completa
- ✅ **Sistema de Calendário 100% funcional** 🎉

---

## 🔗 FASE 5: Integrações e Refinamentos (2 sprints)

### Sprint 20: Integração Request → Approval (1 semana)

#### Objetivo: Criar aprovação automaticamente

```typescript
// No CreateRequestUseCase, adicionar:
if (requiresApproval) {
  // Determinar aprovadores baseado no tipo de requisição
  const approvers = await this.determineApprovers(type, metadata)
  
  // Criar aprovação automaticamente
  await this.createApprovalUseCase.execute({
    title: `Aprovação: ${title}`,
    description,
    type: 'SEQUENTIAL', // ou conforme regra de negócio
    entityType: 'REQUEST',
    entityId: request.id,
    steps: approvers.map((approverId, index) => ({
      name: `Step ${index + 1}`,
      approverId,
      order: index
    }))
  })
}
```

#### Testes E2E
```typescript
test/e2e/integrations/request-with-approval.e2e-spec.ts
```

**Entregáveis Sprint 20:**
- ✅ Requisição cria aprovação automaticamente
- ✅ Callbacks funcionando
- ✅ Notificações integradas

---

### Sprint 21: Refinamentos e Documentação (1 semana)

#### Tarefas
1. Revisar todos os testes
2. Adicionar logs com Winston
3. Adicionar métricas
4. Documentar APIs (Swagger)
5. Criar exemplos de uso
6. README para cada sistema

#### Documentação
```markdown
docs/api/NOTIFICATIONS_API.md
docs/api/REQUESTS_API.md
docs/api/APPROVALS_API.md
docs/api/CALENDAR_API.md
docs/WORKFLOW_EXAMPLES.md
```

**Entregáveis Sprint 21:**
- ✅ Documentação completa
- ✅ Exemplos de integração
- ✅ **Todos os 4 sistemas 100% funcionais e integrados** 🎉🎉🎉

---

## 📊 Cronograma Consolidado

| Fase | Sistema | Sprints | Duração | Testes Estimados |
|------|---------|---------|---------|------------------|
| **FASE 1** | Notificações | 3 | 3 semanas | ~95 testes |
| **FASE 2** | Requisições | 5 | 5 semanas | ~165 testes |
| **FASE 3** | Aprovações | 6 | 6 semanas | ~205 testes |
| **FASE 4** | Calendário | 5 | 5 semanas | ~140 testes |
| **FASE 5** | Integrações | 2 | 2 semanas | ~50 testes |
| **TOTAL** | - | **21** | **21 semanas** | **~655 testes** |

---

## 🎯 Marcos Importantes (Milestones)

### ✅ Milestone 1: Sistema de Notificações (Sprint 3)
**Data Prevista:** Semana 3  
**Critérios:**
- [ ] API REST completa
- [ ] Email worker funcionando
- [ ] ~95 testes passando
- [ ] Documentação básica

### ✅ Milestone 2: Sistema de Requisições (Sprint 8)
**Data Prevista:** Semana 8  
**Critérios:**
- [ ] API REST completa
- [ ] Integração com Notificações
- [ ] Ciclo de informações funcionando
- [ ] ~165 testes passando

### ✅ Milestone 3: Sistema de Aprovações (Sprint 14) ⭐⭐⭐
**Data Prevista:** Semana 14  
**Critérios:**
- [ ] 4 tipos de aprovação funcionando (SINGLE, SEQUENTIAL, PARALLEL, VOTING)
- [ ] **Ciclo de devolução/resubmissão validado** ⭐
- [ ] ~205 testes passando
- [ ] Sistema mais complexo concluído

### ✅ Milestone 4: Sistema de Calendário (Sprint 19)
**Data Prevista:** Semana 19  
**Critérios:**
- [ ] Eventos com recorrência
- [ ] Lembretes automáticos
- [ ] ~140 testes passando

### 🎉 Milestone 5: Integração Completa (Sprint 21)
**Data Prevista:** Semana 21  
**Critérios:**
- [ ] 4 sistemas integrados
- [ ] ~655 testes passando
- [ ] Documentação completa
- [ ] Pronto para produção

---

## 🧪 Estratégia de Testes

### Testes Unitários (~450 testes)
- Entities e Value Objects
- Use Cases (isolados com mocks)
- Repositories (in-memory)

### Testes E2E (~205 testes)
- Controllers e Routes
- Integrações entre sistemas
- Fluxos completos (request → approval → notification)

### Cobertura Mínima
- **Geral:** 80%
- **Use Cases:** 95%
- **Entities:** 90%

---

## 🚀 Preparação para Produção

### Antes do Deploy
1. [ ] Todos os testes passando
2. [ ] Code review completo
3. [ ] Documentação atualizada
4. [ ] Migrations testadas em staging
5. [ ] Workers configurados (cron jobs)
6. [ ] Email service testado
7. [ ] Storage configurado (S3 ou local)
8. [ ] Rate limits configurados
9. [ ] Logs e métricas funcionando
10. [ ] Backup de banco configurado

### Variáveis de Ambiente
```env
# Notificações
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

# Storage (Anexos)
STORAGE_TYPE=local # ou s3
AWS_BUCKET=
AWS_REGION=

# Workers
ENABLE_NOTIFICATION_WORKER=true
ENABLE_REMINDER_WORKER=true

# SLA
DEFAULT_REQUEST_SLA_DAYS=5
DEFAULT_APPROVAL_TIMEOUT_DAYS=7
```

---

## 📈 Métricas de Sucesso

### KPIs Técnicos
- ✅ 100% dos testes passando
- ✅ Cobertura ≥ 80%
- ✅ Tempo de resposta API < 200ms (p95)
- ✅ Zero downtime nos workers
- ✅ Taxa de entrega de email > 98%

### KPIs de Negócio
- ✅ Requisições processadas em < 24h (90%)
- ✅ Aprovações respondidas dentro do SLA (80%)
- ✅ Notificações entregues em < 5min (95%)
- ✅ Zero perda de dados (eventos, anexos, histórico)

---

## 🎯 Próximos Passos

### Imediatos
1. ✅ Planning concluído (WORKFLOW_SYSTEMS_PLANNING.md)
2. ✅ Casos de uso especificados (WORKFLOW_USE_CASES.md)
3. ✅ Roadmap criado (este documento)
4. 🔄 **Iniciar Sprint 1: Notificações**

### Como Começar Sprint 1
```bash
# 1. Criar branch
git checkout -b feature/notifications-foundation

# 2. Criar migration
npx prisma migrate dev --name add_notifications_system

# 3. Implementar entities (TDD)
# Começar por: src/entities/notifications/notification.ts

# 4. Implementar repositories
# 5. Rodar testes
npm run test

# 6. Commit e PR
```

---

## 📚 Referências

- **Planning:** `docs/WORKFLOW_SYSTEMS_PLANNING.md`
- **Use Cases:** `docs/WORKFLOW_USE_CASES.md`
- **RBAC Frontend:** `docs/RBAC_FRONTEND_IMPLEMENTATION.md`
- **Architecture:** Clean Architecture + DDD
- **Testing:** Vitest + Supertest

---

**Status:** ✅ Roadmap Completo  
**Aprovação Necessária:** Sim  
**Pronto para Começar:** Sim 🚀

**Estimativa Total:** 21 semanas (~5 meses) para 4 sistemas completos e integrados
