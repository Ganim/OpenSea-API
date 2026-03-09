# Task Board Frontend — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Task Board frontend with 4 views (Kanban, List, Table, Calendar), keyboard shortcuts, and a card detail modal with tabs — following Linear's UX as reference.

**Architecture:** Next.js 16 page under `(dashboard)/(tools)/tasks/`, React Query for server state, @dnd-kit for drag-and-drop, @fullcalendar for calendar view, shadcn/ui, URL params for view/filter state. All user-facing text in Portuguese (pt-BR).

**Tech Stack:** Next.js 16, React 19, TailwindCSS 4, shadcn/ui, @dnd-kit/core + @dnd-kit/sortable, @fullcalendar/react, @tanstack/react-query, sonner, Zod

**Reference project:** `D:/Code/Projetos/OpenSea/OpenSea-APP` (frontend) / `D:/Code/Projetos/OpenSea/OpenSea-API` (backend — already complete)

**Design doc:** `docs/plans/2026-03-05-task-board-frontend-design.md`

---

## Pre-requisites

Before starting, run from `D:/Code/Projetos/OpenSea/OpenSea-APP`:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

@fullcalendar, shadcn/ui, sonner, @tanstack/react-query are already installed.

---

## API Endpoints Reference (Backend already complete)

All endpoints under `/v1/tasks/`. Base pattern: JWT + tenant middleware + RBAC permissions.

### Boards
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards` | List boards |
| POST | `/v1/tasks/boards` | Create board |
| GET | `/v1/tasks/boards/:boardId` | Get board |
| PATCH | `/v1/tasks/boards/:boardId` | Update board |
| DELETE | `/v1/tasks/boards/:boardId` | Delete board |
| PATCH | `/v1/tasks/boards/:boardId/archive` | Archive/unarchive |
| POST | `/v1/tasks/boards/:boardId/members` | Invite member |
| PATCH | `/v1/tasks/boards/:boardId/members/:memberId` | Update member role |
| DELETE | `/v1/tasks/boards/:boardId/members/:memberId` | Remove member |

### Columns
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/v1/tasks/boards/:boardId/columns` | Create column |
| PATCH | `/v1/tasks/boards/:boardId/columns/:columnId` | Update column |
| DELETE | `/v1/tasks/boards/:boardId/columns/:columnId` | Delete column |
| PATCH | `/v1/tasks/boards/:boardId/columns/reorder` | Reorder columns |

### Cards
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/cards` | List cards |
| POST | `/v1/tasks/boards/:boardId/cards` | Create card |
| GET | `/v1/tasks/boards/:boardId/cards/:cardId` | Get card |
| PATCH | `/v1/tasks/boards/:boardId/cards/:cardId` | Update card |
| DELETE | `/v1/tasks/boards/:boardId/cards/:cardId` | Delete card |
| PATCH | `/v1/tasks/boards/:boardId/cards/:cardId/move` | Move card |
| PATCH | `/v1/tasks/boards/:boardId/cards/:cardId/assign` | Assign card |
| PATCH | `/v1/tasks/boards/:boardId/cards/:cardId/archive` | Archive card |
| PUT | `/v1/tasks/boards/:boardId/cards/:cardId/labels` | Manage card labels |

### Labels
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/labels` | List labels |
| POST | `/v1/tasks/boards/:boardId/labels` | Create label |
| PATCH | `/v1/tasks/boards/:boardId/labels/:labelId` | Update label |
| DELETE | `/v1/tasks/boards/:boardId/labels/:labelId` | Delete label |

### Comments
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/cards/:cardId/comments` | List comments |
| POST | `/v1/tasks/boards/:boardId/cards/:cardId/comments` | Create comment |
| PATCH | `/v1/tasks/boards/:boardId/cards/:cardId/comments/:commentId` | Update comment |
| DELETE | `/v1/tasks/boards/:boardId/cards/:cardId/comments/:commentId` | Delete comment |
| POST | `.../comments/:commentId/reactions` | Add reaction |
| DELETE | `.../comments/:commentId/reactions/:emoji` | Remove reaction |

### Subtasks
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/cards/:cardId/subtasks` | List subtasks |
| POST | `/v1/tasks/boards/:boardId/cards/:cardId/subtasks` | Create subtask |
| PATCH | `.../subtasks/:subtaskId` | Update subtask |
| DELETE | `.../subtasks/:subtaskId` | Delete subtask |
| PATCH | `.../subtasks/:subtaskId/complete` | Toggle complete |

### Checklists
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/v1/tasks/boards/:boardId/cards/:cardId/checklists` | Create checklist |
| PATCH | `.../checklists/:checklistId` | Update checklist |
| DELETE | `.../checklists/:checklistId` | Delete checklist |
| POST | `.../checklists/:checklistId/items` | Add item |
| PATCH | `.../checklists/:checklistId/items/:itemId/toggle` | Toggle item |
| DELETE | `.../checklists/:checklistId/items/:itemId` | Delete item |

### Custom Fields
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/custom-fields` | List fields |
| POST | `/v1/tasks/boards/:boardId/custom-fields` | Create field |
| PATCH | `.../custom-fields/:fieldId` | Update field |
| DELETE | `.../custom-fields/:fieldId` | Delete field |
| PUT | `.../cards/:cardId/custom-fields` | Set card field values |

### Attachments
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/cards/:cardId/attachments` | List attachments |
| POST | `/v1/tasks/boards/:boardId/cards/:cardId/attachments` | Upload attachment |
| DELETE | `.../attachments/:attachmentId` | Delete attachment |

### Automations
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/automations` | List automations |
| POST | `/v1/tasks/boards/:boardId/automations` | Create automation |
| PATCH | `.../automations/:automationId` | Update automation |
| DELETE | `.../automations/:automationId` | Delete automation |
| PATCH | `.../automations/:automationId/toggle` | Toggle active |

### Activity
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/v1/tasks/boards/:boardId/activity` | Board activity |
| GET | `/v1/tasks/boards/:boardId/cards/:cardId/activity` | Card activity |

---

## Task 1: Types — Create all TypeScript interfaces

**Files:**
- Create: `src/types/tasks/board.types.ts`
- Create: `src/types/tasks/card.types.ts`
- Create: `src/types/tasks/column.types.ts`
- Create: `src/types/tasks/label.types.ts`
- Create: `src/types/tasks/member.types.ts`
- Create: `src/types/tasks/comment.types.ts`
- Create: `src/types/tasks/checklist.types.ts`
- Create: `src/types/tasks/subtask.types.ts`
- Create: `src/types/tasks/attachment.types.ts`
- Create: `src/types/tasks/activity.types.ts`
- Create: `src/types/tasks/automation.types.ts`
- Create: `src/types/tasks/custom-field.types.ts`
- Create: `src/types/tasks/index.ts`
- Modify: `src/types/index.ts` — add `export * from './tasks'`

All files go in `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/tasks/`.

**Important enums (from backend Zod schemas):**
- Board types: `'PERSONAL' | 'TEAM'`
- Board visibility: `'PRIVATE' | 'SHARED'`
- Board member role: `'VIEWER' | 'EDITOR'`
- Card status: `'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELED'`
- Card priority: `'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'`
- Automation trigger: `'CARD_MOVED' | 'CARD_CREATED' | 'DUE_DATE_REACHED' | 'LABEL_ADDED'`
- Automation action: `'MOVE_CARD' | 'ASSIGN_MEMBER' | 'ADD_LABEL' | 'SET_PRIORITY' | 'SEND_NOTIFICATION'`
- Custom field type: `'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'CHECKBOX' | 'URL' | 'EMAIL'`
- Activity type: `'CARD_CREATED' | 'CARD_UPDATED' | 'CARD_MOVED' | 'CARD_ARCHIVED' | 'MEMBER_ASSIGNED' | 'MEMBER_UNASSIGNED' | 'LABEL_ADDED' | 'LABEL_REMOVED' | 'COMMENT_ADDED' | 'FIELD_CHANGED' | 'SUBTASK_ADDED' | 'SUBTASK_UPDATED' | 'SUBTASK_REMOVED' | 'SUBTASK_REOPENED' | 'CHECKLIST_ITEM_COMPLETED' | 'CHECKLIST_ITEM_UNCOMPLETED'`

**Step 1:** Create `src/types/tasks/board.types.ts`

```typescript
export type BoardType = 'PERSONAL' | 'TEAM';
export type BoardVisibility = 'PRIVATE' | 'SHARED';

export interface Board {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  color: string | null;
  type: BoardType;
  visibility: BoardVisibility;
  ownerId: string;
  ownerName: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  columns?: Column[];
  labels?: Label[];
  members?: BoardMember[];
  _count?: {
    cards: number;
    members: number;
  };
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  color?: string;
  type?: BoardType;
  visibility?: BoardVisibility;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  color?: string;
  type?: BoardType;
  visibility?: BoardVisibility;
}

export interface BoardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  includeArchived?: boolean;
}

// Forward declarations for circular refs
import type { Column } from './column.types';
import type { Label } from './label.types';
import type { BoardMember } from './member.types';
```

**Step 2:** Create `src/types/tasks/column.types.ts`

```typescript
export interface Column {
  id: string;
  boardId: string;
  name: string;
  color: string | null;
  position: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
  _count?: {
    cards: number;
  };
}

export interface CreateColumnRequest {
  name: string;
  color?: string;
  position?: number;
}

export interface UpdateColumnRequest {
  name?: string;
  color?: string;
}

export interface ReorderColumnsRequest {
  columns: Array<{ id: string; position: number }>;
}
```

**Step 3:** Create `src/types/tasks/card.types.ts`

```typescript
export type CardStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
export type CardPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: CardStatus;
  priority: CardPriority;
  position: number;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours: number | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string;
  creatorName: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  labels?: CardLabel[];
  subtasks?: Card[];
  checklists?: Checklist[];
  customFieldValues?: CardCustomFieldValue[];
  _count?: {
    subtasks: number;
    completedSubtasks: number;
    comments: number;
    attachments: number;
  };
}

export interface CardLabel {
  id: string;
  cardId: string;
  labelId: string;
  label?: import('./label.types').Label;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  columnId: string;
  priority?: CardPriority;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  assigneeId?: string;
  parentId?: string;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  priority?: CardPriority;
  dueDate?: string | null;
  startDate?: string | null;
  estimatedHours?: number | null;
}

export interface MoveCardRequest {
  columnId: string;
  position: number;
}

export interface AssignCardRequest {
  assigneeId: string | null;
}

export interface ManageCardLabelsRequest {
  labelIds: string[];
}

export interface CardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  columnId?: string;
  assigneeId?: string;
  priority?: CardPriority;
  status?: CardStatus;
  includeArchived?: boolean;
}

import type { Checklist } from './checklist.types';
import type { CardCustomFieldValue } from './custom-field.types';

// Priority colors and labels (PT-BR)
export const PRIORITY_CONFIG: Record<CardPriority, { label: string; color: string; dotColor: string }> = {
  URGENT: { label: 'Urgente', color: 'text-red-600', dotColor: 'bg-red-500' },
  HIGH: { label: 'Alta', color: 'text-orange-600', dotColor: 'bg-orange-500' },
  MEDIUM: { label: 'Media', color: 'text-yellow-600', dotColor: 'bg-yellow-500' },
  LOW: { label: 'Baixa', color: 'text-blue-600', dotColor: 'bg-blue-500' },
  NONE: { label: 'Nenhuma', color: 'text-muted-foreground', dotColor: 'bg-gray-400' },
};

export const STATUS_CONFIG: Record<CardStatus, { label: string; color: string }> = {
  OPEN: { label: 'Aberto', color: 'text-gray-600' },
  IN_PROGRESS: { label: 'Em Progresso', color: 'text-blue-600' },
  DONE: { label: 'Concluido', color: 'text-green-600' },
  CANCELED: { label: 'Cancelado', color: 'text-red-600' },
};
```

**Step 4:** Create `src/types/tasks/label.types.ts`

```typescript
export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
}
```

**Step 5:** Create `src/types/tasks/member.types.ts`

```typescript
export type BoardMemberRole = 'VIEWER' | 'EDITOR';

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: BoardMemberRole;
  joinedAt: string;
}

export interface InviteMemberRequest {
  userId: string;
  role?: BoardMemberRole;
}

export interface UpdateMemberRoleRequest {
  role: BoardMemberRole;
}
```

**Step 6:** Create `src/types/tasks/comment.types.ts`

```typescript
export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  userName: string | null;
  emoji: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}
```

**Step 7:** Create `src/types/tasks/checklist.types.ts`

```typescript
export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  position: number;
  createdAt: string;
  items: ChecklistItem[];
}

export interface CreateChecklistRequest {
  title: string;
}

export interface UpdateChecklistRequest {
  title?: string;
}

export interface AddChecklistItemRequest {
  title: string;
}
```

**Step 8:** Create remaining type files: `subtask.types.ts`, `attachment.types.ts`, `activity.types.ts`, `automation.types.ts`, `custom-field.types.ts`

```typescript
// subtask.types.ts — subtasks reuse Card type, just re-export
export type { Card as Subtask, CreateCardRequest as CreateSubtaskRequest } from './card.types';

export interface CompleteSubtaskRequest {
  completed: boolean;
}
```

```typescript
// attachment.types.ts
export interface CardAttachment {
  id: string;
  cardId: string;
  fileId: string;
  fileName: string | null;
  addedBy: string;
  addedByName: string | null;
  createdAt: string;
  file?: {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  };
}

export interface UploadAttachmentRequest {
  fileId: string;
  fileName?: string;
}
```

```typescript
// activity.types.ts
export type CardActivityType =
  | 'CARD_CREATED' | 'CARD_UPDATED' | 'CARD_MOVED' | 'CARD_ARCHIVED'
  | 'MEMBER_ASSIGNED' | 'MEMBER_UNASSIGNED'
  | 'LABEL_ADDED' | 'LABEL_REMOVED'
  | 'COMMENT_ADDED' | 'FIELD_CHANGED'
  | 'SUBTASK_ADDED' | 'SUBTASK_UPDATED' | 'SUBTASK_REMOVED' | 'SUBTASK_REOPENED'
  | 'CHECKLIST_ITEM_COMPLETED' | 'CHECKLIST_ITEM_UNCOMPLETED';

export interface CardActivity {
  id: string;
  cardId: string | null;
  boardId: string;
  userId: string;
  userName: string | null;
  type: CardActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
}
```

```typescript
// automation.types.ts
export type AutomationTrigger = 'CARD_MOVED' | 'CARD_CREATED' | 'DUE_DATE_REACHED' | 'LABEL_ADDED';
export type AutomationAction = 'MOVE_CARD' | 'ASSIGN_MEMBER' | 'ADD_LABEL' | 'SET_PRIORITY' | 'SEND_NOTIFICATION';

export interface BoardAutomation {
  id: string;
  boardId: string;
  name: string;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, unknown>;
  action: AutomationAction;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAutomationRequest {
  name: string;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, unknown>;
  action: AutomationAction;
  actionConfig: Record<string, unknown>;
}

export interface UpdateAutomationRequest {
  name?: string;
  trigger?: AutomationTrigger;
  triggerConfig?: Record<string, unknown>;
  action?: AutomationAction;
  actionConfig?: Record<string, unknown>;
}
```

```typescript
// custom-field.types.ts
export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'CHECKBOX' | 'URL' | 'EMAIL';

export interface CustomField {
  id: string;
  boardId: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  isRequired: boolean;
  position: number;
  createdAt: string;
}

export interface CreateCustomFieldRequest {
  name: string;
  type: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
}

export interface UpdateCustomFieldRequest {
  name?: string;
  type?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
}

export interface CardCustomFieldValue {
  id: string;
  cardId: string;
  fieldId: string;
  value: string | null;
  field?: CustomField;
}

export interface SetCardCustomFieldValuesRequest {
  values: Array<{ fieldId: string; value: string | null }>;
}
```

**Step 9:** Create barrel `src/types/tasks/index.ts`

```typescript
export * from './board.types';
export * from './card.types';
export * from './column.types';
export * from './label.types';
export * from './member.types';
export * from './comment.types';
export * from './checklist.types';
export * from './subtask.types';
export * from './attachment.types';
export * from './activity.types';
export * from './automation.types';
export * from './custom-field.types';
```

**Step 10:** Modify `src/types/index.ts` — add `export * from './tasks'`

**Step 11:** Commit

```bash
git add src/types/tasks/
git commit -m "feat(tasks): add TypeScript types for task board module"
```

---

## Task 2: API Config — Add TASKS endpoints

**Files:**
- Modify: `src/config/api.ts` — add TASKS section

**Step 1:** Add to `API_ENDPOINTS` in `src/config/api.ts` (after CALENDAR section, around line 587):

```typescript
  // Tasks
  TASKS: {
    BOARDS: {
      LIST: '/v1/tasks/boards',
      CREATE: '/v1/tasks/boards',
      GET: (boardId: string) => `/v1/tasks/boards/${boardId}`,
      UPDATE: (boardId: string) => `/v1/tasks/boards/${boardId}`,
      DELETE: (boardId: string) => `/v1/tasks/boards/${boardId}`,
      ARCHIVE: (boardId: string) => `/v1/tasks/boards/${boardId}/archive`,
      MEMBERS: {
        INVITE: (boardId: string) => `/v1/tasks/boards/${boardId}/members`,
        UPDATE: (boardId: string, memberId: string) => `/v1/tasks/boards/${boardId}/members/${memberId}`,
        REMOVE: (boardId: string, memberId: string) => `/v1/tasks/boards/${boardId}/members/${memberId}`,
      },
    },
    COLUMNS: {
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/columns`,
      UPDATE: (boardId: string, columnId: string) => `/v1/tasks/boards/${boardId}/columns/${columnId}`,
      DELETE: (boardId: string, columnId: string) => `/v1/tasks/boards/${boardId}/columns/${columnId}`,
      REORDER: (boardId: string) => `/v1/tasks/boards/${boardId}/columns/reorder`,
    },
    CARDS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/cards`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/cards`,
      GET: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}`,
      UPDATE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}`,
      DELETE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}`,
      MOVE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/move`,
      ASSIGN: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/assign`,
      ARCHIVE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/archive`,
      LABELS: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/labels`,
    },
    LABELS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/labels`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/labels`,
      UPDATE: (boardId: string, labelId: string) => `/v1/tasks/boards/${boardId}/labels/${labelId}`,
      DELETE: (boardId: string, labelId: string) => `/v1/tasks/boards/${boardId}/labels/${labelId}`,
    },
    COMMENTS: {
      LIST: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/comments`,
      CREATE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/comments`,
      UPDATE: (boardId: string, cardId: string, commentId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
      DELETE: (boardId: string, cardId: string, commentId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
      ADD_REACTION: (boardId: string, cardId: string, commentId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}/reactions`,
      REMOVE_REACTION: (boardId: string, cardId: string, commentId: string, emoji: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}/reactions/${emoji}`,
    },
    SUBTASKS: {
      LIST: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks`,
      CREATE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks`,
      UPDATE: (boardId: string, cardId: string, subtaskId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks/${subtaskId}`,
      DELETE: (boardId: string, cardId: string, subtaskId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks/${subtaskId}`,
      COMPLETE: (boardId: string, cardId: string, subtaskId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks/${subtaskId}/complete`,
    },
    CHECKLISTS: {
      CREATE: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists`,
      UPDATE: (boardId: string, cardId: string, checklistId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`,
      DELETE: (boardId: string, cardId: string, checklistId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`,
      ADD_ITEM: (boardId: string, cardId: string, checklistId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items`,
      TOGGLE_ITEM: (boardId: string, cardId: string, checklistId: string, itemId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}/toggle`,
      DELETE_ITEM: (boardId: string, cardId: string, checklistId: string, itemId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
    },
    CUSTOM_FIELDS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/custom-fields`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/custom-fields`,
      UPDATE: (boardId: string, fieldId: string) => `/v1/tasks/boards/${boardId}/custom-fields/${fieldId}`,
      DELETE: (boardId: string, fieldId: string) => `/v1/tasks/boards/${boardId}/custom-fields/${fieldId}`,
      SET_VALUES: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/custom-fields`,
    },
    ATTACHMENTS: {
      LIST: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/attachments`,
      UPLOAD: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/attachments`,
      DELETE: (boardId: string, cardId: string, attachmentId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/attachments/${attachmentId}`,
    },
    AUTOMATIONS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/automations`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/automations`,
      UPDATE: (boardId: string, automationId: string) => `/v1/tasks/boards/${boardId}/automations/${automationId}`,
      DELETE: (boardId: string, automationId: string) => `/v1/tasks/boards/${boardId}/automations/${automationId}`,
      TOGGLE: (boardId: string, automationId: string) => `/v1/tasks/boards/${boardId}/automations/${automationId}/toggle`,
    },
    ACTIVITY: {
      BOARD: (boardId: string) => `/v1/tasks/boards/${boardId}/activity`,
      CARD: (boardId: string, cardId: string) => `/v1/tasks/boards/${boardId}/cards/${cardId}/activity`,
    },
  },
```

**Step 2:** Commit

```bash
git add src/config/api.ts
git commit -m "feat(tasks): add API endpoints config for task board"
```

---

## Task 3: Services — API call layer

**Files:**
- Create: `src/services/tasks/boards-service.ts`
- Create: `src/services/tasks/cards-service.ts`
- Create: `src/services/tasks/columns-service.ts`
- Create: `src/services/tasks/labels-service.ts`
- Create: `src/services/tasks/members-service.ts`
- Create: `src/services/tasks/comments-service.ts`
- Create: `src/services/tasks/subtasks-service.ts`
- Create: `src/services/tasks/checklists-service.ts`
- Create: `src/services/tasks/attachments-service.ts`
- Create: `src/services/tasks/activity-service.ts`
- Create: `src/services/tasks/automations-service.ts`
- Create: `src/services/tasks/custom-fields-service.ts`
- Create: `src/services/tasks/index.ts`

Follow the pattern from `src/services/calendar/calendar-events.service.ts`:
- Import `apiClient` from `@/lib/api-client`
- Import `API_ENDPOINTS` from `@/config/api`
- Import types from `@/types/tasks`
- Export response interfaces + service object with async methods
- Build query strings with URLSearchParams for list endpoints

**Example — boards-service.ts:**

```typescript
import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { Board, BoardsQuery, CreateBoardRequest, UpdateBoardRequest } from '@/types/tasks';

export interface BoardsResponse {
  boards: Board[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface BoardResponse {
  board: Board;
}

export const boardsService = {
  async list(params: BoardsQuery = {}): Promise<BoardsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.includeArchived) query.append('includeArchived', 'true');
    const qs = query.toString();
    return apiClient.get<BoardsResponse>(`${API_ENDPOINTS.TASKS.BOARDS.LIST}${qs ? `?${qs}` : ''}`);
  },

  async get(boardId: string): Promise<BoardResponse> {
    return apiClient.get<BoardResponse>(API_ENDPOINTS.TASKS.BOARDS.GET(boardId));
  },

  async create(data: CreateBoardRequest): Promise<BoardResponse> {
    return apiClient.post<BoardResponse>(API_ENDPOINTS.TASKS.BOARDS.CREATE, data);
  },

  async update(boardId: string, data: UpdateBoardRequest): Promise<BoardResponse> {
    return apiClient.patch<BoardResponse>(API_ENDPOINTS.TASKS.BOARDS.UPDATE(boardId), data);
  },

  async delete(boardId: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.TASKS.BOARDS.DELETE(boardId));
  },

  async archive(boardId: string, archive: boolean): Promise<BoardResponse> {
    return apiClient.patch<BoardResponse>(API_ENDPOINTS.TASKS.BOARDS.ARCHIVE(boardId), { archive });
  },
};
```

Repeat the same pattern for all other services. Each service wraps the corresponding API_ENDPOINTS section.

**Key service patterns:**
- `cardsService` — `list(boardId, params)`, `get(boardId, cardId)`, `create(boardId, data)`, `update(boardId, cardId, data)`, `delete(boardId, cardId)`, `move(boardId, cardId, data)`, `assign(boardId, cardId, data)`, `archive(boardId, cardId, archive)`, `manageLabels(boardId, cardId, data)`
- `columnsService` — `create(boardId, data)`, `update(boardId, columnId, data)`, `delete(boardId, columnId)`, `reorder(boardId, data)`
- `commentsService` — `list(boardId, cardId)`, `create(boardId, cardId, data)`, `update(boardId, cardId, commentId, data)`, `delete(boardId, cardId, commentId)`, `addReaction(boardId, cardId, commentId, emoji)`, `removeReaction(boardId, cardId, commentId, emoji)`
- All other services follow the same pattern

**Barrel export `src/services/tasks/index.ts`:**

```typescript
export { boardsService } from './boards-service';
export { cardsService } from './cards-service';
export { columnsService } from './columns-service';
export { labelsService } from './labels-service';
export { membersService } from './members-service';
export { commentsService } from './comments-service';
export { subtasksService } from './subtasks-service';
export { checklistsService } from './checklists-service';
export { attachmentsService } from './attachments-service';
export { activityService } from './activity-service';
export { automationsService } from './automations-service';
export { customFieldsService } from './custom-fields-service';
```

**Commit:**

```bash
git add src/services/tasks/
git commit -m "feat(tasks): add service layer for all task board API calls"
```

---

## Task 4: React Query Hooks — Core data hooks

**Files:**
- Create: `src/hooks/tasks/use-boards.ts`
- Create: `src/hooks/tasks/use-cards.ts`
- Create: `src/hooks/tasks/use-columns.ts`
- Create: `src/hooks/tasks/use-labels.ts`
- Create: `src/hooks/tasks/use-members.ts`
- Create: `src/hooks/tasks/use-comments.ts`
- Create: `src/hooks/tasks/use-subtasks.ts`
- Create: `src/hooks/tasks/use-checklists.ts`
- Create: `src/hooks/tasks/use-attachments.ts`
- Create: `src/hooks/tasks/use-activity.ts`
- Create: `src/hooks/tasks/use-automations.ts`
- Create: `src/hooks/tasks/use-custom-fields.ts`
- Create: `src/hooks/tasks/index.ts`

Follow the pattern from `src/hooks/calendar/use-calendar-events.ts`:
- Define `QUERY_KEYS` constant at top
- `useQuery` for reads with `enabled` guards
- `useMutation` for writes with `onSuccess` that invalidates relevant queries
- For Kanban drag: add optimistic updates with `onMutate` + `onError` rollback

**Example — use-boards.ts:**

```typescript
import { boardsService } from '@/services/tasks';
import type { BoardsResponse, BoardResponse } from '@/services/tasks/boards-service';
import type { BoardsQuery, CreateBoardRequest, UpdateBoardRequest } from '@/types/tasks';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const BOARD_QUERY_KEYS = {
  BOARDS: ['task-boards'],
  BOARD: (id: string) => ['task-boards', id],
} as const;

export function useBoards(params: BoardsQuery = {}) {
  return useQuery({
    queryKey: [...BOARD_QUERY_KEYS.BOARDS, params],
    queryFn: () => boardsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: BOARD_QUERY_KEYS.BOARD(boardId),
    queryFn: () => boardsService.get(boardId),
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardRequest) => boardsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
    },
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: UpdateBoardRequest }) =>
      boardsService.update(boardId, data),
    onSuccess: (_, { boardId }) => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => boardsService.delete(boardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
    },
  });
}

export function useArchiveBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, archive }: { boardId: string; archive: boolean }) =>
      boardsService.archive(boardId, archive),
    onSuccess: (_, { boardId }) => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}
```

**Example — use-cards.ts (with optimistic move for drag-and-drop):**

```typescript
import { cardsService } from '@/services/tasks';
import type { CardsResponse } from '@/services/tasks/cards-service';
import type { CardsQuery, CreateCardRequest, UpdateCardRequest, MoveCardRequest, Card } from '@/types/tasks';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const CARD_QUERY_KEYS = {
  CARDS: (boardId: string) => ['task-cards', boardId],
  CARD: (boardId: string, cardId: string) => ['task-cards', boardId, cardId],
} as const;

export function useCards(boardId: string, params: CardsQuery = {}) {
  return useQuery({
    queryKey: [...CARD_QUERY_KEYS.CARDS(boardId), params],
    queryFn: () => cardsService.list(boardId, params),
    enabled: !!boardId,
    placeholderData: keepPreviousData,
  });
}

export function useCard(boardId: string, cardId: string) {
  return useQuery({
    queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
    queryFn: () => cardsService.get(boardId, cardId),
    enabled: !!boardId && !!cardId,
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardRequest) => cardsService.create(boardId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: UpdateCardRequest }) =>
      cardsService.update(boardId, cardId, data),
    onSuccess: (_, { cardId }) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: MoveCardRequest }) =>
      cardsService.move(boardId, cardId, data),
    // Optimistic update for smooth drag-and-drop
    onMutate: async ({ cardId, data }) => {
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      const previousQueries = qc.getQueriesData<CardsResponse>({
        queryKey: CARD_QUERY_KEYS.CARDS(boardId),
      });

      qc.setQueriesData<CardsResponse>(
        { queryKey: CARD_QUERY_KEYS.CARDS(boardId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards.map((c) =>
              c.id === cardId ? { ...c, columnId: data.columnId, position: data.position } : c
            ),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_, __, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => cardsService.delete(boardId, cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
    },
  });
}

export function useAssignCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, assigneeId }: { cardId: string; assigneeId: string | null }) =>
      cardsService.assign(boardId, cardId, { assigneeId }),
    onSuccess: (_, { cardId }) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useArchiveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, archive }: { cardId: string; archive: boolean }) =>
      cardsService.archive(boardId, cardId, archive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
    },
  });
}

export function useManageCardLabels(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelIds }: { cardId: string; labelIds: string[] }) =>
      cardsService.manageLabels(boardId, cardId, { labelIds }),
    onSuccess: (_, { cardId }) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}
```

All other hooks follow the same pattern. Hooks for columns, labels, members, comments, subtasks, checklists, attachments, activity, automations, custom-fields.

**Barrel `src/hooks/tasks/index.ts`:**

```typescript
export * from './use-boards';
export * from './use-cards';
export * from './use-columns';
export * from './use-labels';
export * from './use-members';
export * from './use-comments';
export * from './use-subtasks';
export * from './use-checklists';
export * from './use-attachments';
export * from './use-activity';
export * from './use-automations';
export * from './use-custom-fields';
```

**Commit:**

```bash
git add src/hooks/tasks/
git commit -m "feat(tasks): add React Query hooks for all task entities"
```

---

## Task 5: Menu Integration

**Files:**
- Modify: The component that renders the sidebar/navigation menu to include "Tarefas" item

**Step 1:** Find where menu items are configured. The `MenuItem` interface is in `src/types/menu.ts`. Menu items are likely configured in the navigation component or a constants file. Search for `KanbanSquare` or `Calendar` icon imports to find the exact location.

Add to the tools section (near Calendar):

```typescript
{
  id: 'tasks',
  label: 'Tarefas',
  icon: <KanbanSquare className="h-4 w-4" />,
  href: '/tasks',
  requiredPermission: 'tasks.boards.list',
}
```

Import `KanbanSquare` from `lucide-react`.

**Commit:**

```bash
git add <modified-files>
git commit -m "feat(tasks): add Tarefas menu item to navigation"
```

---

## Task 6: Landing Page — Board List

**Files:**
- Create: `src/app/(dashboard)/(tools)/tasks/page.tsx`
- Create: `src/components/tasks/boards/board-list.tsx`
- Create: `src/components/tasks/boards/board-create-dialog.tsx`
- Create: `src/components/tasks/shared/empty-states.tsx`

**Step 1:** Create `src/app/(dashboard)/(tools)/tasks/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { KanbanSquare, Plus, Search, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBoards } from '@/hooks/tasks';
import { usePermissions } from '@/hooks/use-permissions';
import { BoardList } from '@/components/tasks/boards/board-list';
import { BoardCreateDialog } from '@/components/tasks/boards/board-create-dialog';

export default function TasksPage() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = hasPermission('tasks.boards.create');

  const { data, isLoading } = useBoards({ search, includeArchived: showArchived });

  const boards = data?.boards ?? [];
  const activeBoards = boards.filter((b) => !b.archivedAt);
  const archivedBoards = boards.filter((b) => b.archivedAt);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KanbanSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quadros de Tarefas</h1>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Quadro
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar quadros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Board Grid */}
      <BoardList boards={activeBoards} isLoading={isLoading} />

      {/* Archived */}
      {archivedBoards.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Archive className="h-4 w-4" />
            Arquivados ({archivedBoards.length})
          </button>
          {showArchived && <BoardList boards={archivedBoards} isLoading={false} />}
        </div>
      )}

      {/* Create Dialog */}
      <BoardCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

**Step 2:** Create `src/components/tasks/boards/board-list.tsx` — Grid of board cards with name, color, member count, progress bar. Each card links to `/tasks/[boardId]`. Context menu with rename, duplicate, archive, delete.

**Step 3:** Create `src/components/tasks/boards/board-create-dialog.tsx` — Dialog with form (name, description, color picker, type, visibility). Uses `useCreateBoard` hook. Toast on success/error.

**Step 4:** Create `src/components/tasks/shared/empty-states.tsx` — Reusable empty state component with illustration slot, title, description, CTA button.

**Commit:**

```bash
git add src/app/\(dashboard\)/\(tools\)/tasks/ src/components/tasks/
git commit -m "feat(tasks): add board listing page with create dialog"
```

---

## Task 7: Board Page Layout + Header

**Files:**
- Create: `src/app/(dashboard)/(tools)/tasks/[boardId]/layout.tsx`
- Create: `src/app/(dashboard)/(tools)/tasks/[boardId]/page.tsx`
- Create: `src/components/tasks/shared/view-toggle.tsx`
- Create: `src/components/tasks/shared/board-filters.tsx`

**Step 1:** Create `layout.tsx` — fetches board data, shows breadcrumb + board name + header bar. Uses `useBoard(boardId)`.

**Step 2:** Create `page.tsx` — reads `?view=` from URL params (default `kanban`). Renders the correct view component based on the param. Uses `useCards(boardId)` to fetch all cards.

```typescript
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useBoard } from '@/hooks/tasks';
import { useCards } from '@/hooks/tasks';
import { KanbanView } from '@/components/tasks/views/kanban-view';
import { ListView } from '@/components/tasks/views/list-view';
import { TableView } from '@/components/tasks/views/table-view';
import { TaskCalendarView } from '@/components/tasks/views/calendar-view';
import { ViewToggle } from '@/components/tasks/shared/view-toggle';
import { BoardFilters } from '@/components/tasks/shared/board-filters';
// ... more imports

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'kanban';

  const { data: boardData, isLoading: boardLoading } = useBoard(boardId);
  const { data: cardsData, isLoading: cardsLoading } = useCards(boardId, { limit: 100 });

  const board = boardData?.board;
  const cards = cardsData?.cards ?? [];

  // Filter state
  // ... useState for priority, assignee, label filters

  const viewComponent = {
    kanban: <KanbanView board={board} cards={filteredCards} boardId={boardId} />,
    list: <ListView board={board} cards={filteredCards} boardId={boardId} />,
    table: <TableView board={board} cards={filteredCards} boardId={boardId} />,
    calendar: <TaskCalendarView board={board} cards={filteredCards} boardId={boardId} />,
  }[view] ?? <KanbanView board={board} cards={cards} boardId={boardId} />;

  return (
    <div className="flex flex-col h-full">
      {/* Header with view toggle + filters */}
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <ViewToggle currentView={view} />
        <BoardFilters /* filter state props */ />
      </div>

      {/* View content */}
      <div className="flex-1 overflow-auto">
        {viewComponent}
      </div>
    </div>
  );
}
```

**Step 3:** Create `ViewToggle` — 4 toggle buttons (LayoutGrid, List, Table, Calendar icons from lucide-react). Updates URL `?view=` param using `useRouter().replace()`.

**Step 4:** Create `BoardFilters` — Popover-based filter for priority, assignee, label. Shows active filters as removable chips.

**Commit:**

```bash
git add src/app/\(dashboard\)/\(tools\)/tasks/\[boardId\]/ src/components/tasks/shared/
git commit -m "feat(tasks): add board page with view toggle and filters"
```

---

## Task 8: Kanban View

**Files:**
- Create: `src/components/tasks/views/kanban-view.tsx`
- Create: `src/components/tasks/cards/card-item.tsx`
- Create: `src/components/tasks/cards/card-inline-create.tsx`
- Create: `src/components/tasks/shared/priority-badge.tsx`
- Create: `src/components/tasks/shared/label-badge.tsx`
- Create: `src/components/tasks/shared/member-avatar.tsx`

**Step 1:** Create `kanban-view.tsx` — Uses `@dnd-kit/core` DndContext + `@dnd-kit/sortable` for columns and cards.

Key structure:
```typescript
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

// DndContext wraps all columns
// Each column is a droppable area with SortableContext for its cards
// DragOverlay shows the dragged card's preview
// onDragEnd calls useMoveCard mutation
```

Each column renders:
- Column header (name, card count, color bar)
- List of `CardItem` components (sortable)
- `CardInlineCreate` at the bottom
- Horizontal scroll for many columns
- "+ Coluna" button at the end

**Step 2:** Create `card-item.tsx` — Compact card used in Kanban and List views.

```typescript
// Shows: priority border, title (2 lines), labels, subtask progress, assignee avatar, due date
// Hover: subtle elevation/shadow
// Click: opens card detail modal
```

**Step 3:** Create `card-inline-create.tsx` — Input that appears when clicking "+ Novo card". Enter creates card with just title. Escape cancels.

**Step 4:** Create shared badge/avatar components (`priority-badge.tsx`, `label-badge.tsx`, `member-avatar.tsx`).

**Commit:**

```bash
git add src/components/tasks/views/kanban-view.tsx src/components/tasks/cards/ src/components/tasks/shared/
git commit -m "feat(tasks): add Kanban view with drag-and-drop"
```

---

## Task 9: Card Detail Modal

**Files:**
- Create: `src/components/tasks/cards/card-detail-modal.tsx`
- Create: `src/components/tasks/tabs/card-details-tab.tsx`
- Create: `src/components/tasks/tabs/card-subtasks-tab.tsx`
- Create: `src/components/tasks/tabs/card-checklist-tab.tsx`
- Create: `src/components/tasks/tabs/card-comments-tab.tsx`
- Create: `src/components/tasks/tabs/card-custom-fields-tab.tsx`
- Create: `src/components/tasks/tabs/card-activity-tab.tsx`

**Step 1:** Create `card-detail-modal.tsx` — Uses shadcn Dialog (max-w-4xl). Header with editable title. Properties row with inline-editable dropdowns (column, priority, assignee, due date, labels). Tabs component for the 6 tabs.

```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// Uses useCard(boardId, cardId) for data
// Uses useUpdateCard for inline property edits
```

**Step 2:** Create each tab component:
- **card-details-tab.tsx** — Description (textarea, click-to-edit), attachments grid, recent activity summary (last 5 items)
- **card-subtasks-tab.tsx** — List of subtasks with checkboxes, inline create, uses `useSubtasks`, `useCreateSubtask`, `useCompleteSubtask`
- **card-checklist-tab.tsx** — Multiple checklists with items, progress bar, toggle items, uses `useChecklists` hooks
- **card-comments-tab.tsx** — Comment feed with textarea input, emoji reactions, uses `useComments` hooks
- **card-custom-fields-tab.tsx** — Renders custom field form based on board's field definitions, uses `useCustomFields` hooks
- **card-activity-tab.tsx** — Chronological activity feed, uses `useCardActivity` hook

**Step 3:** Wire the modal into the board page — open when clicking any card, close on Escape or click outside.

**Commit:**

```bash
git add src/components/tasks/cards/card-detail-modal.tsx src/components/tasks/tabs/
git commit -m "feat(tasks): add card detail modal with 6 tabs"
```

---

## Task 10: Card Create Dialog

**Files:**
- Create: `src/components/tasks/cards/card-create-dialog.tsx`

Full creation dialog with form: title (required), description, column (select), priority (select), assignee (select from members), labels (multi-select), due date (date picker), estimated hours.

Uses `useCreateCard` hook. Toast on success/error.

**Commit:**

```bash
git add src/components/tasks/cards/card-create-dialog.tsx
git commit -m "feat(tasks): add full card creation dialog"
```

---

## Task 11: List View

**Files:**
- Create: `src/components/tasks/views/list-view.tsx`

Groups cards by column (status). Each group is collapsible. Each row shows priority dot, title, labels, assignee, due date. Click opens card detail modal. Reuses `CardItem` or a simplified row component.

**Commit:**

```bash
git add src/components/tasks/views/list-view.tsx
git commit -m "feat(tasks): add List view (Linear style)"
```

---

## Task 12: Table View

**Files:**
- Create: `src/components/tasks/views/table-view.tsx`

Uses a table with sortable headers. Columns: #, Title, Status, Priority, Assignee, Due Date, Labels. Click header to sort. Inline editing for status/priority/assignee via dropdown in cell. Click title opens modal.

Can use shadcn `Table` component or `@tanstack/react-table` if needed for sorting/selection.

**Commit:**

```bash
git add src/components/tasks/views/table-view.tsx
git commit -m "feat(tasks): add Table view with sortable columns"
```

---

## Task 13: Calendar View

**Files:**
- Create: `src/components/tasks/views/calendar-view.tsx`

Reuses `@fullcalendar/react` (already installed from Calendar module). Maps cards with `dueDate` to calendar events. Priority determines event color. Click opens card detail modal. Drag on calendar updates dueDate.

Reference: `src/components/calendar/calendar-view.tsx` for @fullcalendar setup.

```typescript
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
```

**Commit:**

```bash
git add src/components/tasks/views/calendar-view.tsx
git commit -m "feat(tasks): add Calendar view with @fullcalendar"
```

---

## Task 14: Keyboard Shortcuts

**Files:**
- Create: `src/hooks/tasks/use-keyboard-shortcuts.ts`
- Create: `src/components/tasks/shared/keyboard-shortcuts-modal.tsx`

**Step 1:** Create `use-keyboard-shortcuts.ts` — useEffect that listens to keydown events. Maps keys to actions. Only active when no input/textarea/dialog is focused.

```typescript
import { useEffect, useCallback } from 'react';

interface ShortcutActions {
  onNewCard?: () => void;
  onEditCard?: () => void;
  onSearch?: () => void;
  onSetPriority?: (level: number) => void;
  onAssignLabel?: () => void;
  onAssignMember?: () => void;
  onSetDueDate?: () => void;
  onDuplicateCard?: () => void;
  onArchiveCard?: () => void;
  onShowHelp?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onOpenCard?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handler = useCallback((e: KeyboardEvent) => {
    // Skip if typing in input/textarea
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

    switch (e.key.toLowerCase()) {
      case 'n': actions.onNewCard?.(); break;
      case 'e': actions.onEditCard?.(); break;
      case '/': e.preventDefault(); actions.onSearch?.(); break;
      case '1': case '2': case '3': case '4':
        actions.onSetPriority?.(parseInt(e.key)); break;
      case 'l': actions.onAssignLabel?.(); break;
      case 'm': actions.onAssignMember?.(); break;
      case 'p': actions.onSetDueDate?.(); break;
      case 'd': actions.onDuplicateCard?.(); break;
      case '?': actions.onShowHelp?.(); break;
      case 'arrowup': actions.onNavigateUp?.(); break;
      case 'arrowdown': actions.onNavigateDown?.(); break;
      case 'arrowleft': actions.onNavigateLeft?.(); break;
      case 'arrowright': actions.onNavigateRight?.(); break;
      case 'enter': actions.onOpenCard?.(); break;
    }
    if (e.key === 'Delete') actions.onArchiveCard?.();
  }, [actions]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
```

**Step 2:** Create `keyboard-shortcuts-modal.tsx` — Dialog showing all shortcuts in a table. Triggered by `?` key.

**Step 3:** Wire shortcuts into the board page component.

**Commit:**

```bash
git add src/hooks/tasks/use-keyboard-shortcuts.ts src/components/tasks/shared/keyboard-shortcuts-modal.tsx
git commit -m "feat(tasks): add keyboard shortcuts (Linear style)"
```

---

## Task 15: Board Settings Dialogs

**Files:**
- Create: `src/components/tasks/boards/board-settings-dialog.tsx`
- Create: `src/components/tasks/boards/board-members-dialog.tsx`
- Create: `src/components/tasks/boards/board-labels-dialog.tsx`
- Create: `src/components/tasks/boards/board-automations-dialog.tsx`
- Create: `src/components/tasks/boards/board-custom-fields-dialog.tsx`

Each dialog manages its respective entity:
- **Settings** — Edit name, description, color, visibility, columns (create/rename/reorder/delete)
- **Members** — List members, invite by user search, change role, remove
- **Labels** — Create/edit/delete labels with color picker
- **Automations** — Create/edit/delete automations (trigger + action config)
- **Custom Fields** — Create/edit/delete custom fields (name, type, options)

All use their respective hooks from Task 4.

**Commit:**

```bash
git add src/components/tasks/boards/
git commit -m "feat(tasks): add board settings dialogs (members, labels, automations, custom fields)"
```

---

## Task 16: Polish and Error Handling

**Files:**
- Modify: Various components created in Tasks 6-15

**Step 1:** Add loading skeletons to all views (board list, kanban, list, table, calendar)

**Step 2:** Add error toasts to all mutations:
```typescript
onError: (error) => {
  toast.error(error instanceof Error ? error.message : 'Erro ao executar acao');
}
```

**Step 3:** Add empty states:
- No boards → "Crie seu primeiro quadro de tarefas"
- No cards in board → "Nenhum card neste quadro. Crie o primeiro!"
- No comments → "Nenhum comentario ainda"
- No subtasks → "Nenhuma subtarefa"

**Step 4:** Add permission gating:
- Hide create/edit/delete buttons for users without the respective permission
- Show read-only view when user has only `*.list`/`*.read` permissions

**Step 5:** Add archived board banner:
- When `board.archivedAt` is set, show a yellow banner "Este quadro esta arquivado" and disable all actions

**Commit:**

```bash
git add src/components/tasks/
git commit -m "feat(tasks): add loading states, error handling, empty states, permission gating"
```

---

## Summary

| Task | Description | Est. Files |
|------|-------------|-----------|
| 1 | Types (all interfaces) | 13 files |
| 2 | API Config (endpoints) | 1 file |
| 3 | Services (API layer) | 13 files |
| 4 | React Query Hooks | 13 files |
| 5 | Menu integration | 1-2 files |
| 6 | Landing page (board list) | 4 files |
| 7 | Board page + header | 4 files |
| 8 | Kanban view | 6 files |
| 9 | Card detail modal + tabs | 7 files |
| 10 | Card create dialog | 1 file |
| 11 | List view | 1 file |
| 12 | Table view | 1 file |
| 13 | Calendar view | 1 file |
| 14 | Keyboard shortcuts | 2 files |
| 15 | Board settings dialogs | 5 files |
| 16 | Polish & error handling | Modify existing |
| **Total** | | **~72 files** |

## Execution Order

Tasks 1-4 are foundation (types, config, services, hooks) — do these first.
Tasks 5-8 are the core UI (menu, landing, board page, kanban) — do next.
Tasks 9-10 are the card detail experience — do next.
Tasks 11-13 are additional views — can be done in parallel.
Tasks 14-16 are enhancements — do last.
