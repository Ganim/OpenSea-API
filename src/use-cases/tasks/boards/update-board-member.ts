import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMemberDTO } from '@/mappers/tasks/board/board-to-dto';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface UpdateBoardMemberRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  targetUserId: string;
  role: string;
}

interface UpdateBoardMemberResponse {
  member: BoardMemberDTO;
}

export class UpdateBoardMemberUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(
    request: UpdateBoardMemberRequest,
  ): Promise<UpdateBoardMemberResponse> {
    const { tenantId, userId, boardId, targetUserId, role } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (board.ownerId.toString() !== userId) {
      throw new ForbiddenError('Only the board owner can update member roles');
    }

    const existingMember = await this.boardMembersRepository.findByBoardAndUser(
      boardId,
      targetUserId,
    );

    if (!existingMember) {
      throw new ResourceNotFoundError('Board member not found');
    }

    const updatedMember = await this.boardMembersRepository.update({
      id: existingMember.id,
      boardId,
      role,
    });

    if (!updatedMember) {
      throw new ResourceNotFoundError('Board member not found');
    }

    return {
      member: {
        id: updatedMember.id,
        boardId: updatedMember.boardId,
        userId: updatedMember.userId,
        role: updatedMember.role,
        userName: updatedMember.userName ?? null,
        userEmail: updatedMember.userEmail ?? null,
        createdAt: updatedMember.createdAt,
      },
    };
  }
}
