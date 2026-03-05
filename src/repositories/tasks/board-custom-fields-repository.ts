export interface BoardCustomFieldRecord {
  id: string;
  boardId: string;
  name: string;
  type: string;
  options: Record<string, unknown> | null;
  position: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardCustomFieldSchema {
  boardId: string;
  name: string;
  type: string;
  options?: Record<string, unknown> | null;
  position?: number;
  isRequired?: boolean;
}

export interface UpdateBoardCustomFieldSchema {
  id: string;
  boardId: string;
  name?: string;
  type?: string;
  options?: Record<string, unknown> | null;
  position?: number;
  isRequired?: boolean;
}

export interface BoardCustomFieldsRepository {
  create(data: CreateBoardCustomFieldSchema): Promise<BoardCustomFieldRecord>;
  findById(id: string, boardId: string): Promise<BoardCustomFieldRecord | null>;
  findByBoardId(boardId: string): Promise<BoardCustomFieldRecord[]>;
  update(
    data: UpdateBoardCustomFieldSchema,
  ): Promise<BoardCustomFieldRecord | null>;
  delete(id: string, boardId: string): Promise<void>;
}
