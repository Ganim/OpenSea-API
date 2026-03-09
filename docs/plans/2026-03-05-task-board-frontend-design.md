# Task Board Frontend — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Task Board frontend (Kanban/project management) for the OpenSea platform, following Linear's minimalist UX as the primary reference.

**Architecture:** Next.js 16 page under `(dashboard)/(tools)/tasks/`, using React Query for server state, @dnd-kit for drag-and-drop, @fullcalendar for calendar view, shadcn/ui components, and URL search params for shareable filter/view state. All text in Portuguese (pt-BR).

**Tech Stack:** Next.js 16, React 19, TailwindCSS 4, shadcn/ui, @dnd-kit/core + @dnd-kit/sortable, @fullcalendar/react, React Query, sonner (toasts), Zod (validation)

---

## 1. User Preferences (Validated)

| Decision | Choice |
|----------|--------|
| UI Reference | Linear (minimalist, keyboard-driven, fast) |
| Views | Kanban + Lista + Tabela + Calendario |
| Card Detail | Modal central (large, with tabs) |
| Card Creation | Inline quick (title only) + Dialog (full form) |
| Keyboard Shortcuts | Yes, essential (N, E, /, 1-4, L, M, P, D, Del, ?, arrows) |

## 2. Route Structure

```
src/app/(dashboard)/(tools)/tasks/
  page.tsx                       -> Board listing (landing page)
  [boardId]/
    page.tsx                     -> Board with 4 views
    layout.tsx                   -> Board layout with header
```

## 3. Component Architecture

```
src/components/tasks/
  boards/
    board-list.tsx               -> Grid of board cards
    board-create-dialog.tsx      -> Create board dialog
    board-settings-dialog.tsx    -> Board settings (name, color, columns, labels, custom fields)
  views/
    kanban-view.tsx              -> Kanban with @dnd-kit drag-and-drop
    list-view.tsx                -> Grouped list (Linear style)
    table-view.tsx               -> Spreadsheet-like table with sortable columns
    calendar-view.tsx            -> @fullcalendar integration (month/week/day)
  cards/
    card-item.tsx                -> Compact card (kanban/list row)
    card-detail-modal.tsx        -> Central modal with tabs
    card-create-dialog.tsx       -> Full creation dialog
    card-inline-create.tsx       -> Inline title input (Enter = create)
  tabs/
    card-details-tab.tsx         -> Description (markdown), attachments, recent activity
    card-subtasks-tab.tsx        -> Subtask list with checkbox, inline create, reorder
    card-checklist-tab.tsx       -> Multiple checklists with progress bars
    card-comments-tab.tsx        -> Comment feed with reactions
    card-custom-fields-tab.tsx   -> Custom field values
    card-activity-tab.tsx        -> Full change history
  shared/
    priority-badge.tsx           -> Priority color indicator
    label-badge.tsx              -> Colored label chip
    member-avatar.tsx            -> User avatar with tooltip
    view-toggle.tsx              -> Kanban/Lista/Tabela/Calendario toggle
    board-filters.tsx            -> Filter bar (priority, status, member, label, date)
    keyboard-shortcuts.tsx       -> Shortcut provider + help modal (?)
    empty-states.tsx             -> Empty state illustrations for boards/cards
```

## 4. Hooks (React Query)

```
src/hooks/tasks/
  use-boards.ts                  -> CRUD boards + archive/restore
  use-cards.ts                   -> CRUD cards + move + reorder + drag
  use-columns.ts                 -> CRUD columns + reorder
  use-labels.ts                  -> CRUD labels
  use-members.ts                 -> CRUD board members
  use-comments.ts                -> CRUD comments + reactions
  use-subtasks.ts                -> CRUD subtasks + complete/reopen
  use-checklists.ts              -> CRUD checklists + toggle items
  use-attachments.ts             -> Upload/delete attachments
  use-activity.ts                -> Card/board activity feed
  use-automations.ts             -> CRUD automations
  use-custom-fields.ts           -> CRUD custom fields + values
  use-keyboard-shortcuts.ts      -> Keyboard shortcut registration + handler
```

## 5. Services (API Layer)

```
src/services/tasks/
  boards-service.ts              -> /v1/tasks/boards/*
  cards-service.ts               -> /v1/tasks/boards/:boardId/cards/*
  columns-service.ts             -> /v1/tasks/boards/:boardId/columns/*
  labels-service.ts              -> /v1/tasks/boards/:boardId/labels/*
  members-service.ts             -> /v1/tasks/boards/:boardId/members/*
  comments-service.ts            -> /v1/tasks/boards/:boardId/cards/:cardId/comments/*
  subtasks-service.ts            -> /v1/tasks/boards/:boardId/cards/:cardId/subtasks/*
  checklists-service.ts          -> /v1/tasks/boards/:boardId/cards/:cardId/checklists/*
  attachments-service.ts         -> /v1/tasks/boards/:boardId/cards/:cardId/attachments/*
  activity-service.ts            -> /v1/tasks/boards/:boardId/activity, /v1/tasks/boards/:boardId/cards/:cardId/activity
  automations-service.ts         -> /v1/tasks/boards/:boardId/automations/*
  custom-fields-service.ts       -> /v1/tasks/boards/:boardId/custom-fields/*
```

## 6. Types

```
src/types/tasks/
  board.types.ts                 -> Board, CreateBoardRequest, BoardSettings
  card.types.ts                  -> Card, CreateCardRequest, CardPriority, CardWithRelations
  column.types.ts                -> Column, CreateColumnRequest
  label.types.ts                 -> Label, CreateLabelRequest
  member.types.ts                -> BoardMember, MemberRole
  comment.types.ts               -> Comment, Reaction, CreateCommentRequest
  checklist.types.ts             -> Checklist, ChecklistItem
  subtask.types.ts               -> Subtask (reuses Card type with parentId)
  attachment.types.ts            -> CardAttachment
  activity.types.ts              -> CardActivity, ActivityType
  automation.types.ts            -> BoardAutomation, AutomationTrigger, AutomationAction
  custom-field.types.ts          -> CustomField, CustomFieldValue, FieldType
  index.ts                       -> Barrel re-exports
```

## 7. Landing Page — Board List

- Grid responsivo: 3 cols desktop, 2 tablet, 1 mobile
- Each card: name, color, card count, member avatars, progress bar (% done)
- Collapsible "Arquivados" section
- Context menu: Renomear, Duplicar, Arquivar, Excluir
- Empty state: illustration + CTA "Crie seu primeiro quadro"
- Create dialog: name, description, color picker, initial columns

## 8. Board Page — Header

- Breadcrumb: "Quadros > Projeto Alpha"
- View toggle: [Kanban] [Lista] [Tabela] [Calendario] with icons
- Active view saved in URL: `?view=kanban`
- Filter bar: Priority, Status, Member, Label, Date — removable chips
- Member avatars row with [+ Membro] button
- Menu: Configuracoes, Membros, Labels, Campos Customizados, Automacoes, Arquivar

## 9. Kanban View

- Columns side by side, horizontal scroll if many
- Cards show: priority (left border color), title (2 lines max), subtask/checklist progress, labels, assignee avatar, due date (red if overdue), comment/attachment count icons
- Drag-and-drop cards between columns (changes status)
- Drag-and-drop within column (reorder, updates `position`)
- Column drag to reorder (drag header)
- "+ Novo card" inline input at bottom of each column
- "+ Coluna" button at the end
- Optimistic updates: move card immediately, revert on error

## 10. List View (Linear style)

- Grouped by column (status), each group collapsible
- Each row: priority dot, title, labels, assignee, due date
- Hover: quick action buttons (edit, move, archive)
- Click row -> opens card detail modal
- Drag between groups to change column
- Inline create at bottom of each group

## 11. Table View

- Sortable columns: #, Title, Status, Priority, Assignee, Due Date, Labels
- Click header to sort asc/desc
- Inline editing: click cell to edit (dropdowns for status/priority/assignee)
- Column resize
- Multi-select rows for bulk actions (move, assign, delete)
- Click title -> opens card detail modal

## 12. Calendar View

- Reuses @fullcalendar/react (already installed)
- Shows cards with dueDate positioned on calendar
- Event color = card priority
- Click card -> opens detail modal
- Drag on calendar -> updates dueDate
- Views: month, week, day
- PT-BR locale (already configured for Calendar module)

## 13. Card Detail Modal

- Width: max-w-4xl (~70% screen)
- Always-visible header: title (editable), close (x), menu
- Properties row (editable inline): column, priority, assignee, due date, labels, estimate
- Tabs:
  1. **Detalhes** — Description (click to edit, markdown), attachments grid, recent activity summary
  2. **Subtarefas** — Subtask list with checkboxes, inline create, drag reorder, priority badges
  3. **Checklist** — Multiple checklists, each with items + progress bar, toggle items
  4. **Comentarios** — Comment feed, text input, emoji reactions, timestamps
  5. **Campos Custom** — Custom field values based on board config
  6. **Atividade** — Full chronological change history
- Footer: [Duplicar] [Arquivar] buttons
- Menu: Duplicar, Mover para outro board, Copiar link, Arquivar, Excluir

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| N | New card (opens dialog) |
| E | Edit selected card |
| / | Search cards |
| 1-4 | Set priority (1=urgent, 4=minimal) |
| L | Assign label |
| M | Assign member |
| P | Set due date (prazo) |
| D | Duplicate card |
| Del | Archive card |
| Esc | Close modal / cancel |
| Up/Down | Navigate between cards |
| Left/Right | Navigate between columns |
| Enter | Open selected card |
| ? | Show all shortcuts |

## 15. Validations and Error Handling

| Scenario | Treatment |
|----------|-----------|
| Board without permission | Redirect to /tasks + toast "Voce nao tem permissao para acessar este quadro" |
| Card not found | Toast error + redirect to board |
| Drag move error | Optimistic revert + toast "Erro ao mover card" |
| Empty title on create | Inline validation, red border |
| Attachment > 10MB | Toast "Arquivo excede o limite de 10MB" |
| Offline | Persistent banner "Sem conexao" |
| Edit conflict | Toast "Este card foi atualizado por outro usuario" |
| Archived board | Banner "Este quadro esta arquivado" + actions disabled |
| No members | Empty state "Adicione membros para comecar a colaborar" |
| Empty board | Empty state with illustration + CTA |

## 16. Permission Gating

Uses `usePermissions()` hook with task permission codes:

- `tasks.boards.create/read/update/delete` — Board CRUD + settings
- `tasks.cards.create/read/update/delete` — Card CRUD + move
- `tasks.comments.create/read/delete` — Comments + reactions
- `tasks.attachments.create/read/delete` — File attachments

UI elements hidden/disabled based on permissions. Read-only mode for users with only `*.read`.

## 17. Navigation and Menu

Add to `src/types/menu.ts`:
- Label: "Tarefas"
- Icon: KanbanSquare (from lucide-react)
- Route: `/tasks`
- Permission: `tasks.boards.read`
- Module: `TASKS` (if module-gated)

## 18. Dependencies to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

@fullcalendar is already installed (from Calendar module).
shadcn/ui is already installed.
sonner is already installed.
