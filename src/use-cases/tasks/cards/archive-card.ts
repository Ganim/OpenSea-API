import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface ArchiveCardRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  archive: boolean;
}

interface ArchiveCardResponse {
  card: CardDTO;
}

export class ArchiveCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: ArchiveCardRequest): Promise<ArchiveCardResponse> {
    const { tenantId, userId, userName, boardId, cardId, archive } =
      request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const updatedCard = await this.cardsRepository.update({
      id: cardId,
      boardId,
      archivedAt: archive ? new Date() : null,
    });

    if (!updatedCard) {
      throw new ResourceNotFoundError('Card not found');
    }

    const activityType = archive ? 'ARCHIVED' : 'RESTORED';
    const activityVerb = archive ? 'arquivou' : 'restaurou';

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: activityType,
      description: `${userName} ${activityVerb} o cartão ${card.title}`,
    });

    return { card: cardToDTO(updatedCard) };
  }
}
