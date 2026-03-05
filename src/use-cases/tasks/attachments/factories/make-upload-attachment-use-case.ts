import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardAttachmentsRepository } from '@/repositories/tasks/prisma/prisma-card-attachments-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { UploadAttachmentUseCase } from '../upload-attachment';

export function makeUploadAttachmentUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardAttachmentsRepository = new PrismaCardAttachmentsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new UploadAttachmentUseCase(cardsRepository, cardAttachmentsRepository, cardActivitiesRepository);
}
