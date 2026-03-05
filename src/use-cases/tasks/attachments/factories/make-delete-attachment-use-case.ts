import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardAttachmentsRepository } from '@/repositories/tasks/prisma/prisma-card-attachments-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { DeleteAttachmentUseCase } from '../delete-attachment';

export function makeDeleteAttachmentUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardAttachmentsRepository = new PrismaCardAttachmentsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new DeleteAttachmentUseCase(cardsRepository, cardAttachmentsRepository, cardActivitiesRepository);
}
