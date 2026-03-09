import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMemberDTO } from '@/mappers/tasks/board/board-to-dto';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface InviteBoardMemberRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  targetUserId: string;
  role: string;
}

interface InviteBoardMemberResponse {
  member: BoardMemberDTO;
}

export class InviteBoardMemberUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(
    request: InviteBoardMemberRequest,
  ): Promise<InviteBoardMemberResponse> {
    const { tenantId, userId, boardId, targetUserId, role } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (board.ownerId.toString() !== userId) {
      throw new ForbiddenError('Only the board owner can invite members');
    }

    if (board.type === 'TEAM') {
      throw new BadRequestError(
        'Cannot invite members to a team board. Use team management instead',
      );
    }

    if (targetUserId === userId) {
      throw new BadRequestError('Cannot invite yourself to your own board');
    }

    const existingMember = await this.boardMembersRepository.findByBoardAndUser(
      boardId,
      targetUserId,
    );

    if (existingMember) {
      throw new BadRequestError('User is already a member of this board');
    }

    const createdMember = await this.boardMembersRepository.create({
      boardId,
      userId: targetUserId,
      role,
    });

    return {
      member: {
        id: createdMember.id,
        boardId: createdMember.boardId,
        userId: createdMember.userId,
        role: createdMember.role,
        userName: createdMember.userName ?? null,
        userEmail: createdMember.userEmail ?? null,
        createdAt: createdMember.createdAt,
      },
    };
  }
}
