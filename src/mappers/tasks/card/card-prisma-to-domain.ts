import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Card } from '@/entities/tasks/card';
import type {
  Card as PrismaCard,
  CardLabel,
  CardChecklist,
  ChecklistItem,
  CardAttachment,
  CardComment,
  CardCustomFieldValue,
  BoardCustomField,
  BoardLabel,
  StorageFile,
} from '@prisma/generated/client.js';

export type CardUser = {
  id: string;
  email: string;
  username: string | null;
  profile?: { name: string; surname: string } | null;
};

export type CardWithRelations = PrismaCard & {
  assignee?: CardUser | null;
  reporter?: CardUser | null;
  labels?: (CardLabel & {
    label: BoardLabel;
  })[];
  checklists?: (CardChecklist & {
    items: ChecklistItem[];
  })[];
  attachments?: (CardAttachment & {
    file?: Pick<StorageFile, 'name' | 'size' | 'mimeType'> | null;
  })[];
  comments?: CardComment[];
  customFieldValues?: (CardCustomFieldValue & {
    field?: Pick<BoardCustomField, 'name' | 'type'> | null;
  })[];
  subtasks?: PrismaCard[];
  _count?: {
    subtasks?: number;
    comments?: number;
    attachments?: number;
  };
};

export function cardPrismaToDomain(raw: PrismaCard): Card {
  return Card.create(
    {
      boardId: new UniqueEntityID(raw.boardId),
      columnId: new UniqueEntityID(raw.columnId),
      parentCardId: raw.parentCardId
        ? new UniqueEntityID(raw.parentCardId)
        : null,
      title: raw.title,
      description: raw.description ?? null,
      status: raw.status,
      priority: raw.priority,
      position: raw.position,
      assigneeId: raw.assigneeId ? new UniqueEntityID(raw.assigneeId) : null,
      reporterId: new UniqueEntityID(raw.reporterId),
      startDate: raw.startDate ?? null,
      dueDate: raw.dueDate ?? null,
      completedAt: raw.completedAt ?? null,
      estimatedMinutes: raw.estimatedMinutes ?? null,
      coverColor: raw.coverColor ?? null,
      coverImageId: raw.coverImageId ?? null,
      metadata: (raw.metadata as Record<string, unknown>) ?? null,
      systemSourceType: raw.systemSourceType ?? null,
      systemSourceId: raw.systemSourceId ?? null,
      archivedAt: raw.archivedAt ?? null,
      deletedAt: raw.deletedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? null,
    },
    new UniqueEntityID(raw.id),
  );
}

function resolveUserName(user: CardUser | null | undefined): string | null {
  if (!user) return null;

  if (user.profile) {
    const fullName =
      `${user.profile.name ?? ''} ${user.profile.surname ?? ''}`.trim();
    return fullName || user.username || null;
  }

  return user.username || null;
}

export function extractCardRelationsFromPrisma(raw: CardWithRelations) {
  const assigneeName = resolveUserName(raw.assignee);
  const reporterName = resolveUserName(raw.reporter);

  const labels = (raw.labels ?? []).map((cardLabel) => ({
    id: cardLabel.label.id,
    boardId: cardLabel.label.boardId,
    name: cardLabel.label.name,
    color: cardLabel.label.color,
    position: cardLabel.label.position,
  }));

  const checklists = (raw.checklists ?? []).map((checklist) => ({
    id: checklist.id,
    cardId: checklist.cardId,
    title: checklist.title,
    position: checklist.position,
    items: checklist.items.map((checklistItem) => ({
      id: checklistItem.id,
      checklistId: checklistItem.checklistId,
      title: checklistItem.title,
      isCompleted: checklistItem.isCompleted,
      assigneeId: checklistItem.assigneeId,
      dueDate: checklistItem.dueDate,
      position: checklistItem.position,
    })),
    createdAt: checklist.createdAt,
  }));

  const customFieldValues = (raw.customFieldValues ?? []).map((fieldValue) => ({
    id: fieldValue.id,
    cardId: fieldValue.cardId,
    fieldId: fieldValue.fieldId,
    fieldName: fieldValue.field?.name ?? null,
    fieldType: fieldValue.field?.type ?? null,
    value: fieldValue.value,
  }));

  const subtaskCount = raw._count?.subtasks ?? raw.subtasks?.length ?? 0;
  const commentCount = raw._count?.comments ?? raw.comments?.length ?? 0;
  const attachmentCount =
    raw._count?.attachments ?? raw.attachments?.length ?? 0;

  return {
    assigneeName,
    reporterName,
    labels,
    checklists,
    customFieldValues,
    subtaskCount,
    commentCount,
    attachmentCount,
  };
}
