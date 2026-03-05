import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  CardAttachmentsRepository,
  CardAttachmentRecord,
} from '@/repositories/tasks/card-attachments-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface UploadAttachmentRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  fileId: string;
  fileName: string;
}

interface UploadAttachmentResponse {
  attachment: CardAttachmentRecord;
}

export class UploadAttachmentUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardAttachmentsRepository: CardAttachmentsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: UploadAttachmentRequest,
  ): Promise<UploadAttachmentResponse> {
    const { boardId, userId, userName, cardId, fileId, fileName } = request;

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const attachment = await this.cardAttachmentsRepository.create({
      cardId,
      fileId,
      addedBy: userId,
    });

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'ATTACHMENT_ADDED',
      description: `${userName} anexou ${fileName} ao cartão ${card.title}`,
    });

    return { attachment };
  }
}
