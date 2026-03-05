import type { Board } from '@/entities/tasks/board';

export interface BoardColumnDTO {
  id: string;
  boardId: string;
  title: string;
  color: string | null;
  position: number;
  isDefault: boolean;
  isDone: boolean;
  wipLimit: number | null;
  archivedAt: Date | null;
  createdAt: Date;
}

export interface BoardLabelDTO {
  id: string;
  boardId: string;
  name: string;
  color: string;
  position: number;
}

export interface BoardMemberDTO {
  id: string;
  boardId: string;
  userId: string;
  role: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
}

export interface BoardDTO {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: string;
  teamId: string | null;
  ownerId: string;
  storageFolderId: string | null;
  visibility: string;
  defaultView: string;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  position: number;
  columns: BoardColumnDTO[];
  labels: BoardLabelDTO[];
  members: BoardMemberDTO[];
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function boardToDTO(
  board: Board,
  options?: {
    columns?: BoardColumnDTO[];
    labels?: BoardLabelDTO[];
    members?: BoardMemberDTO[];
  },
): BoardDTO {
  return {
    id: board.id.toString(),
    tenantId: board.tenantId.toString(),
    title: board.title,
    description: board.description,
    type: board.type,
    teamId: board.teamId?.toString() ?? null,
    ownerId: board.ownerId.toString(),
    storageFolderId: board.storageFolderId,
    visibility: board.visibility,
    defaultView: board.defaultView,
    settings: board.settings,
    metadata: board.metadata,
    position: board.position,
    columns: options?.columns ?? [],
    labels: options?.labels ?? [],
    members: options?.members ?? [],
    archivedAt: board.archivedAt,
    deletedAt: board.deletedAt,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}
