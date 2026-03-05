import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  CardAttachmentsRepository,
  CardAttachmentRecord,
} from '@/repositories/tasks/card-attachments-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface DeleteAttachmentRequest {
  boardId: string;
  cardId: string;
  attachmentId: string;
  userId: string;
  userName: string;
}

interface DeleteAttachmentResponse {
  deletedAttachment: CardAttachmentRecord;
}

export class DeleteAttachmentUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardAttachmentsRepository: CardAttachmentsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: DeleteAttachmentRequest,
  ): Promise<DeleteAttachmentResponse> {
    const { boardId, cardId, attachmentId, userId, userName } = request;

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const attachment = await this.cardAttachmentsRepository.findById(
      attachmentId,
      cardId,
    );

    if (!attachment) {
      throw new ResourceNotFoundError('Attachment not found');
    }

    await this.cardAttachmentsRepository.delete(attachmentId, cardId);

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'ATTACHMENT_REMOVED',
      description: `${userName} removeu um anexo do cartão ${card.title}`,
    });

    return { deletedAttachment: attachment };
  }
}
