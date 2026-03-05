import type { Board } from '@/entities/tasks/board';

export interface CreateBoardSchema {
  tenantId: string;
  title: string;
  description?: string | null;
  type?: string;
  teamId?: string | null;
  ownerId: string;
  storageFolderId?: string | null;
  visibility?: string;
  defaultView?: string;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  position?: number;
}

export interface UpdateBoardSchema {
  id: string;
  tenantId: string;
  title?: string;
  description?: string | null;
  visibility?: string;
  defaultView?: string;
  storageFolderId?: string | null;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  position?: number;
}

export interface FindManyBoardsOptions {
  tenantId: string;
  userId: string;
  type?: string;
  teamId?: string;
  search?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface FindManyBoardsResult {
  boards: Board[];
  total: number;
}

export interface BoardsRepository {
  create(data: CreateBoardSchema): Promise<Board>;
  findById(id: string, tenantId: string): Promise<Board | null>;
  findMany(options: FindManyBoardsOptions): Promise<FindManyBoardsResult>;
  findByTeamId(teamId: string, tenantId: string): Promise<Board[]>;
  update(data: UpdateBoardSchema): Promise<Board | null>;
  archive(id: string, tenantId: string): Promise<void>;
  restore(id: string, tenantId: string): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  reorder(id: string, tenantId: string, newPosition: number): Promise<void>;
}
