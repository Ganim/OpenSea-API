import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardAttachmentsRepository,
  CardAttachmentRecord,
} from '@/repositories/tasks/card-attachments-repository';

interface ListAttachmentsRequest {
  tenantId: string;
  boardId: string;
  cardId: string;
}

interface ListAttachmentsResponse {
  attachments: CardAttachmentRecord[];
}

export class ListAttachmentsUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardAttachmentsRepository: CardAttachmentsRepository,
  ) {}

  async execute(
    request: ListAttachmentsRequest,
  ): Promise<ListAttachmentsResponse> {
    const { tenantId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const attachments =
      await this.cardAttachmentsRepository.findByCardId(cardId);

    return { attachments };
  }
}
