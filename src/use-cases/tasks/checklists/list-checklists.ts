import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  CardChecklistRecord,
  CardChecklistsRepository,
} from '@/repositories/tasks/card-checklists-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface ListChecklistsRequest {
  boardId: string;
  cardId: string;
}

interface ListChecklistsResponse {
  checklists: CardChecklistRecord[];
}

export class ListChecklistsUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardChecklistsRepository: CardChecklistsRepository,
  ) {}

  async execute(
    request: ListChecklistsRequest,
  ): Promise<ListChecklistsResponse> {
    const { boardId, cardId } = request;

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const checklists = await this.cardChecklistsRepository.findByCardId(cardId);

    return { checklists };
  }
}
