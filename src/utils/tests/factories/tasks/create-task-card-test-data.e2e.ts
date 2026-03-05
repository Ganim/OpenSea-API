import { prisma } from '@/lib/prisma';

export async function createTaskCard(
  boardId: string,
  columnId: string,
  reporterId: string,
  overrides?: Partial<{
    title: string;
    description: string;
    priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
    assigneeId: string;
    dueDate: Date;
    parentCardId: string;
  }>,
) {
  const card = await prisma.card.create({
    data: {
      boardId,
      columnId,
      reporterId,
      title: overrides?.title ?? 'Cartão de Teste',
      description: overrides?.description ?? null,
      priority: overrides?.priority ?? 'NONE',
      status: overrides?.status ?? 'OPEN',
      assigneeId: overrides?.assigneeId ?? null,
      dueDate: overrides?.dueDate ?? null,
      parentCardId: overrides?.parentCardId ?? null,
    },
  });

  return card;
}
