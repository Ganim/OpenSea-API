import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardAttachmentsRepository } from '@/repositories/tasks/prisma/prisma-card-attachments-repository';
import { ListAttachmentsUseCase } from '../list-attachments';

export function makeListAttachmentsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardAttachmentsRepository = new PrismaCardAttachmentsRepository();
  return new ListAttachmentsUseCase(boardsRepository, cardAttachmentsRepository);
}
