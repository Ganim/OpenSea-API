import type { Card } from '@/entities/tasks/card';
import type { BoardLabelDTO } from '@/mappers/tasks/board/board-to-dto';

export interface CardChecklistItemDTO {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  assigneeId: string | null;
  dueDate: Date | null;
  position: number;
}

export interface CardChecklistDTO {
  id: string;
  cardId: string;
  title: string;
  position: number;
  items: CardChecklistItemDTO[];
  createdAt: Date;
}

export interface CardCommentDTO {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  mentions: string[] | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface CardAttachmentDTO {
  id: string;
  cardId: string;
  fileId: string;
  addedBy: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
}

export interface CardCustomFieldValueDTO {
  id: string;
  cardId: string;
  fieldId: string;
  fieldName: string | null;
  fieldType: string | null;
  value: unknown;
}

export interface CardDTO {
  id: string;
  boardId: string;
  columnId: string;
  parentCardId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  assigneeId: string | null;
  assigneeName: string | null;
  reporterId: string;
  reporterName: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedMinutes: number | null;
  coverColor: string | null;
  coverImageId: string | null;
  metadata: Record<string, unknown> | null;
  systemSourceType: string | null;
  systemSourceId: string | null;
  labels: BoardLabelDTO[];
  checklists: CardChecklistDTO[];
  customFieldValues: CardCustomFieldValueDTO[];
  subtaskCount: number;
  commentCount: number;
  attachmentCount: number;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function cardToDTO(
  card: Card,
  options?: {
    assigneeName?: string | null;
    reporterName?: string | null;
    labels?: BoardLabelDTO[];
    checklists?: CardChecklistDTO[];
    customFieldValues?: CardCustomFieldValueDTO[];
    subtaskCount?: number;
    commentCount?: number;
    attachmentCount?: number;
  },
): CardDTO {
  return {
    id: card.id.toString(),
    boardId: card.boardId.toString(),
    columnId: card.columnId.toString(),
    parentCardId: card.parentCardId?.toString() ?? null,
    title: card.title,
    description: card.description,
    status: card.status,
    priority: card.priority,
    position: card.position,
    assigneeId: card.assigneeId?.toString() ?? null,
    assigneeName: options?.assigneeName ?? null,
    reporterId: card.reporterId.toString(),
    reporterName: options?.reporterName ?? null,
    startDate: card.startDate,
    dueDate: card.dueDate,
    completedAt: card.completedAt,
    estimatedMinutes: card.estimatedMinutes,
    coverColor: card.coverColor,
    coverImageId: card.coverImageId,
    metadata: card.metadata,
    systemSourceType: card.systemSourceType,
    systemSourceId: card.systemSourceId,
    labels: options?.labels ?? [],
    checklists: options?.checklists ?? [],
    customFieldValues: options?.customFieldValues ?? [],
    subtaskCount: options?.subtaskCount ?? 0,
    commentCount: options?.commentCount ?? 0,
    attachmentCount: options?.attachmentCount ?? 0,
    archivedAt: card.archivedAt,
    deletedAt: card.deletedAt,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}
