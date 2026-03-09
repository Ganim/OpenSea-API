import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { Board } from '@/entities/tasks/board';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';

type AccessLevel = 'read' | 'write';

/**
 * Verifies that a user has access to a board.
 * - Board owners always have full access.
 * - Members with EDITOR role can read and write.
 * - Members with VIEWER role can only read.
 * - Non-members are denied access.
 */
export async function verifyBoardAccess(
  boardMembersRepository: BoardMembersRepository,
  board: Board,
  userId: string,
  level: AccessLevel = 'read',
): Promise<void> {
  const isOwner = board.ownerId.toString() === userId;

  if (isOwner) return;

  const membership = await boardMembersRepository.findByBoardAndUser(
    board.id.toString(),
    userId,
  );

  if (!membership) {
    throw new ForbiddenError('You do not have access to this board');
  }

  if (level === 'write' && membership.role === 'VIEWER') {
    throw new ForbiddenError('Viewers cannot modify board content');
  }
}
