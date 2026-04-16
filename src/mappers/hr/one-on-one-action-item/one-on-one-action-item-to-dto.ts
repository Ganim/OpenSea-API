import type { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';

export interface OneOnOneActionItemDTO {
  id: string;
  meetingId: string;
  ownerId: string;
  content: string;
  isCompleted: boolean;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function oneOnOneActionItemToDTO(
  item: OneOnOneActionItem,
): OneOnOneActionItemDTO {
  return {
    id: item.id.toString(),
    meetingId: item.meetingId.toString(),
    ownerId: item.ownerId.toString(),
    content: item.content,
    isCompleted: item.isCompleted,
    dueDate: item.dueDate ?? null,
    completedAt: item.completedAt ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
