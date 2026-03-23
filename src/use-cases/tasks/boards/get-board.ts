import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BoardDTO,
  type BoardColumnDTO,
  type BoardLabelDTO,
  type BoardMemberDTO,
  boardToDTO,
} from '@/mappers/tasks/board/board-to-dto';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { BoardLabelsRepository } from '@/repositories/tasks/board-labels-repository';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface GetBoardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
}

interface GetBoardResponse {
  board: BoardDTO;
}

export class GetBoardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
    private boardLabelsRepository: BoardLabelsRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(request: GetBoardRequest): Promise<GetBoardResponse> {
    const { tenantId, userId, boardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const isOwner = board.ownerId.toString() === userId;

    if (!isOwner) {
      const membership = await this.boardMembersRepository.findByBoardAndUser(
        boardId,
        userId,
      );

      if (!membership) {
        throw new ForbiddenError('You do not have access to this board');
      }
    }

    let [columns, labels, members] = await Promise.all([
      this.boardColumnsRepository.findByBoardId(boardId),
      this.boardLabelsRepository.findByBoardId(boardId),
      this.boardMembersRepository.findByBoardId(boardId),
    ]);

    // Auto-add owner as member if missing (backward compat for boards created before this fix)
    if (isOwner && !members.some((m) => m.userId === userId)) {
      const ownerMember = await this.boardMembersRepository.create({
        boardId,
        userId,
        role: 'EDITOR',
      });
      members = [...members, ownerMember];
    }

    const columnDTOs: BoardColumnDTO[] = columns.map((column) => ({
      id: column.id,
      boardId: column.boardId,
      title: column.title,
      color: column.color,
      position: column.position,
      isDefault: column.isDefault,
      isDone: column.isDone,
      wipLimit: column.wipLimit,
      archivedAt: column.archivedAt,
      createdAt: column.createdAt,
    }));

    const labelDTOs: BoardLabelDTO[] = labels.map((label) => ({
      id: label.id,
      boardId: label.boardId,
      name: label.name,
      color: label.color,
      position: label.position,
    }));

    const memberDTOs: BoardMemberDTO[] = members.map((member) => ({
      id: member.id,
      boardId: member.boardId,
      userId: member.userId,
      role: member.role,
      userName: member.userName ?? null,
      userEmail: member.userEmail ?? null,
      userAvatarUrl: member.userAvatarUrl ?? null,
      createdAt: member.createdAt,
    }));

    return {
      board: boardToDTO(board, {
        columns: columnDTOs,
        labels: labelDTOs,
        members: memberDTOs,
      }),
    };
  }
}
