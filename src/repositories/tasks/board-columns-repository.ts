export interface BoardColumnRecord {
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
  updatedAt: Date;
}

export interface CreateBoardColumnSchema {
  boardId: string;
  title: string;
  color?: string | null;
  position?: number;
  isDefault?: boolean;
  isDone?: boolean;
  wipLimit?: number | null;
}

export interface UpdateBoardColumnSchema {
  id: string;
  boardId: string;
  title?: string;
  color?: string | null;
  position?: number;
  isDefault?: boolean;
  isDone?: boolean;
  wipLimit?: number | null;
}

export interface BoardColumnsRepository {
  create(data: CreateBoardColumnSchema): Promise<BoardColumnRecord>;
  findById(id: string, boardId: string): Promise<BoardColumnRecord | null>;
  findByBoardId(boardId: string): Promise<BoardColumnRecord[]>;
  findDefaultColumn(boardId: string): Promise<BoardColumnRecord | null>;
  findDoneColumn(boardId: string): Promise<BoardColumnRecord | null>;
  update(data: UpdateBoardColumnSchema): Promise<BoardColumnRecord | null>;
  archive(id: string, boardId: string): Promise<void>;
  restore(id: string, boardId: string): Promise<void>;
  delete(id: string, boardId: string): Promise<void>;
  reorder(id: string, boardId: string, newPosition: number): Promise<void>;
}
