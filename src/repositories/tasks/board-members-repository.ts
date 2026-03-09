export interface BoardMemberRecord {
  id: string;
  boardId: string;
  userId: string;
  role: string;
  createdAt: Date;
  userName?: string | null;
  userEmail?: string | null;
  userAvatarUrl?: string | null;
}

export interface CreateBoardMemberSchema {
  boardId: string;
  userId: string;
  role?: string;
}

export interface UpdateBoardMemberSchema {
  id: string;
  boardId: string;
  role: string;
}

export interface BoardMembersRepository {
  create(data: CreateBoardMemberSchema): Promise<BoardMemberRecord>;
  findByBoardId(boardId: string): Promise<BoardMemberRecord[]>;
  findByBoardAndUser(
    boardId: string,
    userId: string,
  ): Promise<BoardMemberRecord | null>;
  update(data: UpdateBoardMemberSchema): Promise<BoardMemberRecord | null>;
  delete(id: string, boardId: string): Promise<void>;
}
