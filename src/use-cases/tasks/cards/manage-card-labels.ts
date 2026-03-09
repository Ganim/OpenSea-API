import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardLabelsRepository } from '@/repositories/tasks/board-labels-repository';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface ManageCardLabelsRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  labelIds: string[];
}

interface ManageCardLabelsResponse {
  card: CardDTO;
}

export class ManageCardLabelsUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private boardLabelsRepository: BoardLabelsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(
    request: ManageCardLabelsRequest,
  ): Promise<ManageCardLabelsResponse> {
    const { tenantId, userId, userName, boardId, cardId, labelIds } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(
      this.boardMembersRepository,
      board,
      userId,
      'write',
    );

    const cardWithLabels = await this.cardsRepository.findByIdWithLabels(
      cardId,
      boardId,
    );

    if (!cardWithLabels) {
      throw new ResourceNotFoundError('Card not found');
    }

    const { card, labelIds: currentLabelIds } = cardWithLabels;

    const boardLabels = await this.boardLabelsRepository.findByBoardId(boardId);
    const validLabelIds = new Set(boardLabels.map((label) => label.id));
    const labelNameMap = new Map(
      boardLabels.map((label) => [label.id, label.name]),
    );

    for (const labelId of labelIds) {
      if (!validLabelIds.has(labelId)) {
        throw new BadRequestError(
          `Label ${labelId} does not belong to this board`,
        );
      }
    }

    const updatedCard = await this.cardsRepository.update({
      id: cardId,
      boardId,
      labelIds,
    });

    if (!updatedCard) {
      throw new ResourceNotFoundError('Card not found');
    }

    const currentSet = new Set(currentLabelIds);
    const newSet = new Set(labelIds);

    const addedLabelIds = labelIds.filter(
      (labelId) => !currentSet.has(labelId),
    );
    const removedLabelIds = currentLabelIds.filter(
      (labelId) => !newSet.has(labelId),
    );

    for (const addedLabelId of addedLabelIds) {
      const labelName = labelNameMap.get(addedLabelId) ?? addedLabelId;

      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'LABEL_ADDED',
        description: `${userName} adicionou a etiqueta "${labelName}" ao cartão ${card.title}`,
        field: 'labelIds',
        newValue: addedLabelId,
      });
    }

    for (const removedLabelId of removedLabelIds) {
      const labelName = labelNameMap.get(removedLabelId) ?? removedLabelId;

      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'LABEL_REMOVED',
        description: `${userName} removeu a etiqueta "${labelName}" do cartão ${card.title}`,
        field: 'labelIds',
        oldValue: removedLabelId,
      });
    }

    return { card: cardToDTO(updatedCard) };
  }
}
