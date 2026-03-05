export interface BoardLabelRecord {
  id: string;
  boardId: string;
  name: string;
  color: string;
  position: number;
  createdAt: Date;
}

export interface CreateBoardLabelSchema {
  boardId: string;
  name: string;
  color: string;
  position?: number;
}

export interface UpdateBoardLabelSchema {
  id: string;
  boardId: string;
  name?: string;
  color?: string;
  position?: number;
}

export interface BoardLabelsRepository {
  create(data: CreateBoardLabelSchema): Promise<BoardLabelRecord>;
  findById(id: string, boardId: string): Promise<BoardLabelRecord | null>;
  findByBoardId(boardId: string): Promise<BoardLabelRecord[]>;
  update(data: UpdateBoardLabelSchema): Promise<BoardLabelRecord | null>;
  delete(id: string, boardId: string): Promise<void>;
}
