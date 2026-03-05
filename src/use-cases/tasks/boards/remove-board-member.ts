import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface RemoveBoardMemberRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  targetUserId: string;
}

export class RemoveBoardMemberUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(request: RemoveBoardMemberRequest): Promise<void> {
    const { tenantId, userId, boardId, targetUserId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (board.ownerId.toString() !== userId) {
      throw new ForbiddenError(
        'Only the board owner can remove members',
      );
    }

    if (targetUserId === userId) {
      throw new BadRequestError(
        'Cannot remove yourself from your own board',
      );
    }

    const existingMember =
      await this.boardMembersRepository.findByBoardAndUser(
        boardId,
        targetUserId,
      );

    if (!existingMember) {
      throw new ResourceNotFoundError('Board member not found');
    }

    await this.boardMembersRepository.delete(existingMember.id, boardId);
  }
}
