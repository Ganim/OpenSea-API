import { PrismaCardAttachmentsRepository } from '@/repositories/tasks/prisma/prisma-card-attachments-repository';
import { ListAttachmentsUseCase } from '../list-attachments';

export function makeListAttachmentsUseCase() {
  const cardAttachmentsRepository = new PrismaCardAttachmentsRepository();
  return new ListAttachmentsUseCase(cardAttachmentsRepository);
}
