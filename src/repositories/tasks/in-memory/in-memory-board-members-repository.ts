import { randomUUID } from 'node:crypto';
import type {
  BoardMembersRepository,
  BoardMemberRecord,
  CreateBoardMemberSchema,
  UpdateBoardMemberSchema,
} from '../board-members-repository';

export class InMemoryBoardMembersRepository
  implements BoardMembersRepository
{
  public items: BoardMemberRecord[] = [];

  async create(data: CreateBoardMemberSchema): Promise<BoardMemberRecord> {
    const member: BoardMemberRecord = {
      id: randomUUID(),
      boardId: data.boardId,
      userId: data.userId,
      role: data.role ?? 'VIEWER',
      createdAt: new Date(),
      userName: null,
      userEmail: null,
    };

    this.items.push(member);
    return member;
  }

  async findByBoardId(boardId: string): Promise<BoardMemberRecord[]> {
    return this.items.filter((member) => member.boardId === boardId);
  }

  async findByBoardAndUser(
    boardId: string,
    userId: string,
  ): Promise<BoardMemberRecord | null> {
    return (
      this.items.find(
        (member) =>
          member.boardId === boardId && member.userId === userId,
      ) ?? null
    );
  }

  async update(
    data: UpdateBoardMemberSchema,
  ): Promise<BoardMemberRecord | null> {
    const member = this.items.find(
      (member) => member.id === data.id && member.boardId === data.boardId,
    );
    if (!member) return null;

    member.role = data.role;
    return member;
  }

  async delete(id: string, boardId: string): Promise<void> {
    this.items = this.items.filter(
      (member) => !(member.id === id && member.boardId === boardId),
    );
  }
}
