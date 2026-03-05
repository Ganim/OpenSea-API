import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface GetCardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
}

interface GetCardResponse {
  card: CardDTO;
}

export class GetCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
  ) {}

  async execute(request: GetCardRequest): Promise<GetCardResponse> {
    const { tenantId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const cardWithLabels = await this.cardsRepository.findByIdWithLabels(
      cardId,
      boardId,
    );

    if (!cardWithLabels) {
      throw new ResourceNotFoundError('Card not found');
    }

    const { card, labelIds } = cardWithLabels;

    const subtasks = await this.cardsRepository.findSubtasks(cardId);

    return {
      card: cardToDTO(card, {
        labels: labelIds.map((labelId) => ({
          id: labelId,
          boardId,
          name: '',
          color: '',
          position: 0,
        })),
        subtaskCount: subtasks.length,
      }),
    };
  }
}
