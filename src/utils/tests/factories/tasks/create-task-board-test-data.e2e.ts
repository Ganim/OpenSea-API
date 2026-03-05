import { prisma } from '@/lib/prisma';

export async function createTaskBoard(
  tenantId: string,
  ownerId: string,
  overrides?: Partial<{
    title: string;
    type: 'PERSONAL' | 'TEAM';
    teamId: string;
    visibility: 'PRIVATE' | 'SHARED';
  }>,
) {
  const board = await prisma.board.create({
    data: {
      tenantId,
      ownerId,
      title: overrides?.title ?? 'Quadro de Teste',
      type: overrides?.type ?? 'PERSONAL',
      teamId: overrides?.teamId,
      visibility: overrides?.visibility ?? 'PRIVATE',
    },
  });

  // Create default columns
  const todoColumn = await prisma.boardColumn.create({
    data: { boardId: board.id, title: 'A Fazer', position: 0, isDefault: true },
  });
  const inProgressColumn = await prisma.boardColumn.create({
    data: { boardId: board.id, title: 'Em Progresso', position: 1 },
  });
  const doneColumn = await prisma.boardColumn.create({
    data: { boardId: board.id, title: 'Concluído', position: 2, isDone: true },
  });

  return { board, columns: [todoColumn, inProgressColumn, doneColumn] };
}
