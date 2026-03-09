# Análise Completa — Módulo Tasks

**Data**: 2026-03-09
**Analista**: Claude Opus 4.6
**Escopo**: Análise abrangente do módulo Tasks (Backend + Frontend)

---

## Resumo Executivo

| Aspecto | Nota | Status |
|---------|------|--------|
| Arquitetura & Código | 7.5/10 | Bom |
| Segurança | 6.5/10 | Atenção |
| Desempenho | 7.0/10 | Bom |
| UI/UX | 6.5/10 | Atenção |
| Acessibilidade (A11y) | 4.5/10 | Crítico |
| Responsividade (Mobile) | 5.0/10 | Crítico |
| Testes | 7.0/10 | Bom |
| Localização (PT-BR) | 9.0/10 | Excelente |
| Data Fetching & Cache | 7.5/10 | Bom |
| Tratamento de Erros | 6.5/10 | Atenção |
| **NOTA GERAL** | **6.7/10** | **Bom com gaps críticos** |

---

## 1. Arquitetura & Código — 7.5/10

### Pontos Fortes
- Clean Architecture seguida corretamente: Controllers → Use Cases → Repositories
- Repository Pattern com abstrações (Prisma + In-Memory)
- Factories para injeção de dependência
- Entities com getters/setters e Value Objects
- Mappers para conversão Domain ↔ DTO ↔ Prisma
- Erros customizados (BadRequestError, ResourceNotFoundError, ForbiddenError)

### Problemas

#### 🔴 Componente monolítico (CRÍTICO)
- `card-detail-modal.tsx` — **1.122 linhas** em um único componente
- Contém 11+ tabs inline (geral, subtarefas, checklists, campos, atividade, comentários)
- **Recomendação**: Extrair para CardDetailHeader, CardDetailSidebar, CardDetailTabs

#### 🟡 Componentes grandes
| Arquivo | Linhas | Recomendação |
|---------|--------|--------------|
| card-detail-modal.tsx | 1.122 | Dividir em 5-6 componentes |
| board-settings-dialog.tsx | 437 | Extrair formulários |
| kanban-view.tsx | 705 | OK (maioria é lógica de drag) |
| column-options-menu.tsx | 436 | Extrair ColorPickerDialog |
| card-comments-tab.tsx | 411 | Extrair emoji picker |
| card-checklist-tab.tsx | 333 | OK |

#### 🟠 Duplicação de código
- `formatDueDate()` duplicada em 3 arquivos: list-view.tsx:29, card-item.tsx:27, table-view.tsx:36
- `isOverdue()` duplicada em 3 arquivos: list-view.tsx:24, card-item.tsx:18, table-view.tsx:44
- Mapeamento de cores de prioridade duplicado em 3 arquivos: card-item.tsx:42, card-detail-modal.tsx:123, calendar-view.tsx:29
- **Recomendação**: Consolidar em `@/components/tasks/tabs/_utils.ts`

---

## 2. Segurança — 6.5/10

### Pontos Fortes
- Todos os 40+ controllers têm `verifyJwt`, `verifyTenant`, `createPermissionMiddleware`
- Rotas usam `createModuleMiddleware('TASKS')`
- 43 permission codes definidos (boards, cards, comments, labels, custom-fields, attachments, watchers)
- Board access control implementado (owner, EDITOR, VIEWER)
- Input validation via Zod em todos os endpoints

### Problemas

#### 🔴 Validação de tenant ausente em Activity (CRÍTICO)
- **Arquivo**: `use-cases/tasks/activity/list-board-activity.ts` (linha 21-35)
- **Arquivo**: `use-cases/tasks/activity/list-card-activity.ts` (linha 21-35)
- **Risco**: Cross-tenant data leakage — usuários podem acessar activity logs de boards de outros tenants por ID
- **Ataque**: `GET /v1/tasks/boards/:boardId-de-outro-tenant/activity`
- **Fix**: Adicionar validação `board.tenantId === request.tenantId` nos use cases

#### 🔴 tenantId ausente em Attachments (CRÍTICO)
- **Arquivo**: `controllers/tasks/attachments/v1-list-attachments.controller.ts` (linha 54)
- **Arquivo**: `controllers/tasks/attachments/v1-delete-attachment.controller.ts` (linha 42-49)
- **Risco**: Bypass de isolamento de tenant
- **Fix**: Passar `tenantId: request.user.tenantId!` para os use cases

#### 🟠 Campo metadata sem restrição
- **Arquivo**: `schemas/tasks/card.schema.ts` (linhas 26, 43, 95)
- `metadata: z.record(z.string(), z.unknown())` aceita qualquer valor
- **Risco**: LOW-MEDIUM — não é vulnerabilidade direta mas permite dados arbitrários
- **Recomendação**: Restringir para `z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))`

#### 🟡 Audit log com placeholder errado
- **Arquivo**: `controllers/tasks/cards/v1-delete-card.controller.ts` (linha 58)
- `placeholders: { userName, cardTitle: cardId }` — mostra UUID em vez do título
- **Fix**: Buscar `card.title` antes da deleção

---

## 3. Desempenho — 7.0/10

### Pontos Fortes (Backend)
- Nenhum N+1 query encontrado — repositories usam `Promise.all()` para queries paralelas
- Paginação implementada corretamente (max 100 items)
- Board queries otimizadas com includes seletivos

### Problemas (Frontend)

#### 🟡 Componentes sem React.memo
| Componente | Impacto | Recomendação |
|------------|---------|--------------|
| CardItem | Re-renderiza a cada mudança no parent | `memo(CardItem)` |
| BoardList | Re-renderiza grid inteira | `memo(BoardList)` |
| KanbanColumn | Re-renderiza durante drag | Já mitigado pelo useSortable |

#### 🟡 Calendar view carrega todas as libs
- `@fullcalendar/react` com 4 plugins (~60-80KB) carregados imediatamente
- **Recomendação**: `React.lazy(() => import('./calendar-view'))` para lazy loading

#### 🟡 card-detail-modal re-renderiza inteiro
- Trocar tabs re-renderiza todo o modal (1.122 linhas)
- **Recomendação**: React.lazy para cada tab component

#### 🟡 Optimistic updates ausentes
- `useMoveCard()` — card se move no drag mas espera confirmação do servidor
- `useUpdateCard()` — edições inline esperam resposta
- **Recomendação**: Adicionar `onMutate` com `setQueryData()` para UI imediata

---

## 4. UI/UX — 6.5/10

### Pontos Fortes
- Loading states com skeletons em boards page e board detail ✅
- Empty states com componente reutilizável EmptyState ✅
- Toast notifications consistentes em português ✅
- Error state com ícone + mensagem + botão "Voltar" na board page ✅
- Drag-and-drop kanban fluido com DragOverlay ✅
- Gradientes visuais nos boards ✅
- Board sections colapsáveis (Pessoal / Equipe / Arquivados) ✅
- Busca debounced (300ms) nos boards ✅

### Problemas

#### 🟡 Loading state ausente no card-detail-modal
- Modal aparece vazio enquanto card carrega
- Skeleton não exibido para título, metadata, tabs
- **Recomendação**: Adicionar skeleton loader no modal

#### 🟡 Error state ausente no card-detail-modal
- Se o fetch do card falhar, modal fica quebrado
- **Recomendação**: Adicionar fallback com mensagem "Erro ao carregar cartão"

#### 🟡 Empty states sem ação
- "Nenhum cartão nesta coluna" (list-view.tsx:119) — sem botão "Criar cartão"
- "Nenhum cartão encontrado" (table-view.tsx:189) — sem ação
- **Recomendação**: Adicionar botão de ação inline nos empty states

#### 🟠 Mensagens de erro genéricas
- `toast.error('Erro ao atualizar título')` — poderia ser mais informativo
- **Recomendação**: "Título não foi atualizado. Tente novamente."

---

## 5. Acessibilidade (A11y) — 4.5/10

### Pontos Fortes
- Column rename title tem `role="button"` e `tabIndex={0}` ✅
- Keyboard shortcuts modal existe ✅
- KeyboardSensor adicionado ao drag-and-drop ✅

### Problemas (CRÍTICO)

#### 🔴 aria-labels ausentes em elementos interativos
| Elemento | Arquivo | Linha | Fix |
|----------|---------|-------|-----|
| Botão de filtros | board-filters.tsx | 50 | `aria-label="Abrir filtros" aria-expanded={open}` |
| Container kanban | kanban-view.tsx | 309 | `role="region" aria-label="Quadro Kanban"` |
| Card item (div clicável) | card-item.tsx | 99 | Trocar div por `<button>` com aria-label |
| Board cards | board-list.tsx | 51 | `aria-label={`Abrir quadro ${board.title}`}` |
| WIP limit badge | kanban-view.tsx | 516 | `aria-label={`${count} cartões de ${limit}`}` |
| Empty column message | list-view.tsx | 117 | `role="status" aria-live="polite"` |
| Empty table message | table-view.tsx | 183 | `role="status"` |

#### 🔴 Elementos não semânticos
- `card-item.tsx` usa `<div onClick>` em vez de `<button>` — não acessível por teclado
- Drag handle sem `aria-roledescription="Arrastar para reordenar"`

#### 🟡 Screen reader support insuficiente
- Nenhum `aria-live` region para notificar sobre mudanças (card movido, coluna criada)
- Drag-and-drop sem feedback auditivo/textual para screen readers

---

## 6. Responsividade (Mobile) — 5.0/10

### Pontos Fortes
- Board list usa grid responsivo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` ✅
- TouchSensor configurado com delay 200ms ✅
- List view usa `hidden sm:flex` para elementos opcionais ✅

### Problemas

#### 🔴 Kanban não é mobile-friendly (CRÍTICO)
- Colunas com largura fixa `w-[280px]` — maior que viewport mobile
- Layout `flex-row` horizontal sem breakpoint — colunas ficam em scroll horizontal
- **Recomendação**: Empilhar colunas verticalmente em telas pequenas:
  ```css
  sm:flex-col md:flex-row
  sm:w-full md:w-[280px]
  ```

#### 🟡 Table view com colunas fixas
- Larguras fixas (w-36, w-40, w-32) em mobile causam overflow
- `overflow-x-auto` funciona mas UX é ruim

#### 🟡 Card detail modal em mobile
- Modal grande sem adaptação para telas pequenas
- Tabs podem ficar espremidas

---

## 7. Testes — 7.0/10

### Cobertura

| Tipo | Arquivos | Testes | Linhas |
|------|----------|--------|--------|
| Backend Unit | 64 | 278 | 7.362 |
| Backend E2E | 58 | ~116 | 2.719 |
| Frontend E2E (Playwright) | 3 | 10 | 370 |
| Frontend Unit | 1 | 10 | ~100 |
| **Total** | **126** | **~414** | **~10.551** |

### Pontos Fortes
- 100% dos use cases têm unit tests ✅
- 91% dos controllers têm E2E tests ✅
- In-memory repositories bem implementados para mocking ✅
- Edge cases cobertos: soft delete, archived, DONE/CANCELED exclusions ✅
- Test factories reutilizáveis (createTaskBoard, createTaskCard) ✅

### Problemas

#### 🔴 Controllers sem E2E tests (6 faltando)
1. `watchers/v1-watch-card.controller.ts`
2. `watchers/v1-unwatch-card.controller.ts`
3. `watchers/v1-list-card-watchers.controller.ts`
4. `automations/v1-execute-automation.controller.ts`
5. `cards/v1-check-due-date-cards.controller.ts`
6. `activity/v1-record-activity.controller.ts`

#### 🔴 E2E tests superficiais
- Maioria dos E2E tests verifica apenas happy path (1-2 casos por controller)
- Ausentes: 400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict
- Nenhum teste de cross-tenant access denial

#### 🟡 Zero testes unitários de frontend
- Hooks não testados (use-boards, use-cards, use-activity)
- Utilitários não testados (formatDueDate, isOverdue)
- Componentes não testados em isolamento

#### 🟡 Sem testes de concorrência
- Nenhum teste de race condition para movimentação simultânea de cards
- Nenhum teste de execução simultânea de automações

---

## 8. Localização (PT-BR) — 9.0/10

### Pontos Fortes
- Todos os labels, placeholders, toasts, títulos em português formal ✅
- Acentuação correta: "Descrição", "Configurações", "Atividade" ✅
- Mensagens de erro em português ✅
- Empty states em português ✅

### Problemas

#### 🟠 Inconsistência terminológica
- `keyboard-shortcuts-modal.tsx:24` — "Novo card" deveria ser "Novo cartão"
- Mistura de "card" e "cartão" em alguns pontos do código

---

## 9. Data Fetching & Cache — 7.5/10

### Pontos Fortes
- React Query usado consistentemente ✅
- `keepPreviousData` evita spinners em paginação ✅
- `useInfiniteQuery` implementado para activity e boards ✅
- Cache invalidation correta em mutations ✅
- Optimistic delete para boards e cards ✅

### Problemas

#### 🟡 Optimistic updates parciais
- `useDeleteBoard()` tem optimistic update ✅
- `useDeleteCard()` tem optimistic update ✅
- `useMoveCard()` **NÃO** tem optimistic update ❌
- `useUpdateCard()` **NÃO** tem optimistic update ❌
- **Impacto**: Delay perceptível ao mover cards e editar campos inline

---

## 10. Tratamento de Erros — 6.5/10

### Pontos Fortes
- Controllers capturam BadRequestError, ResourceNotFoundError, ForbiddenError ✅
- HTTP status codes corretos (400, 403, 404) ✅
- Error messages propagadas ✅
- Toast errors no frontend ✅

### Problemas

#### 🟡 Sem Error Boundary no card-detail-modal
- Se qualquer tab crashar, todo o modal morre
- **Recomendação**: Wrapping com React Error Boundary

#### 🟡 Mensagens de erro genéricas
- Toasts usam mensagens genéricas sem contexto
- **Recomendação**: Incluir nome do recurso na mensagem

#### 🟠 Audit log placeholder errado
- Delete card usa `cardId` como título no audit log

---

## Top 10 Ações Prioritárias

### Tier 1 — Segurança (URGENTE)
1. **Fix tenant validation em Activity endpoints** — cross-tenant data leakage
2. **Fix tenantId em Attachment controllers** — bypass de isolamento

### Tier 2 — Acessibilidade & Mobile (ALTO)
3. **Adicionar aria-labels** em todos elementos interativos (8 pontos)
4. **Tornar kanban responsivo** — empilhar colunas em mobile
5. **Trocar div por button** em card-item.tsx para semântica correta

### Tier 3 — Qualidade de Código (MÉDIO)
6. **Dividir card-detail-modal.tsx** em 5-6 componentes menores
7. **Adicionar loading/error states** no card-detail-modal
8. **Extrair utilitários duplicados** (formatDueDate, isOverdue, priority colors)

### Tier 4 — Testes & Performance (MÉDIO)
9. **Adicionar E2E tests para watchers** (3 controllers sem cobertura)
10. **Adicionar React.memo** em CardItem e BoardList + optimistic updates em useMoveCard

---

## Conclusão

O módulo Tasks é **funcional e bem estruturado**, com boa adesão ao Clean Architecture e cobertura de testes acima da média (278 unit + ~116 E2E). Os pontos mais críticos são:

1. **Segurança**: 2 falhas de isolamento multi-tenant (activity + attachments)
2. **Acessibilidade**: Nota 4.5/10 — falta aria-labels, elementos semânticos, screen reader support
3. **Mobile**: Kanban com largura fixa não funciona bem em telas pequenas

Com as correções do Tier 1 e 2, a nota geral subiria de **6.7 para ~8.0/10**.
