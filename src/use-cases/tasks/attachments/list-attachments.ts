import type {
  CardAttachmentsRepository,
  CardAttachmentRecord,
} from '@/repositories/tasks/card-attachments-repository';

interface ListAttachmentsRequest {
  cardId: string;
}

interface ListAttachmentsResponse {
  attachments: CardAttachmentRecord[];
}

export class ListAttachmentsUseCase {
  constructor(private cardAttachmentsRepository: CardAttachmentsRepository) {}

  async execute(
    request: ListAttachmentsRequest,
  ): Promise<ListAttachmentsResponse> {
    const { cardId } = request;

    const attachments =
      await this.cardAttachmentsRepository.findByCardId(cardId);

    return { attachments };
  }
}
