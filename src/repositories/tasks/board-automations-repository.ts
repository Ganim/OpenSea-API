export interface BoardAutomationRecord {
  id: string;
  boardId: string;
  name: string;
  isActive: boolean;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  action: string;
  actionConfig: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardAutomationSchema {
  boardId: string;
  name: string;
  isActive?: boolean;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  action: string;
  actionConfig: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateBoardAutomationSchema {
  id: string;
  boardId: string;
  name?: string;
  isActive?: boolean;
  trigger?: string;
  triggerConfig?: Record<string, unknown>;
  action?: string;
  actionConfig?: Record<string, unknown>;
}

export interface BoardAutomationsRepository {
  create(data: CreateBoardAutomationSchema): Promise<BoardAutomationRecord>;
  findById(id: string, boardId: string): Promise<BoardAutomationRecord | null>;
  findByBoardId(boardId: string): Promise<BoardAutomationRecord[]>;
  findActiveByBoardAndTrigger(
    boardId: string,
    trigger: string,
  ): Promise<BoardAutomationRecord[]>;
  update(
    data: UpdateBoardAutomationSchema,
  ): Promise<BoardAutomationRecord | null>;
  delete(id: string, boardId: string): Promise<void>;
}
