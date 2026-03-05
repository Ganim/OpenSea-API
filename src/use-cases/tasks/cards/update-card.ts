import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

const PRIORITY_LABELS: Record<string, string> = {
  NONE: 'Nenhuma',
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Progresso',
  DONE: 'Concluído',
  CANCELED: 'Cancelado',
};

interface UpdateCardRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimatedMinutes?: number | null;
  coverColor?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface UpdateCardResponse {
  card: CardDTO;
}

export class UpdateCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: UpdateCardRequest): Promise<UpdateCardResponse> {
    const { tenantId, userId, userName, boardId, cardId, title } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const existingCard = await this.cardsRepository.findById(cardId, boardId);

    if (!existingCard) {
      throw new ResourceNotFoundError('Card not found');
    }

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new BadRequestError('Card title is required');
      }

      if (title.length > 512) {
        throw new BadRequestError(
          'Card title must be at most 512 characters',
        );
      }
    }

    const oldTitle = existingCard.title;
    const oldPriority = existingCard.priority;
    const oldStatus = existingCard.status;

    let completedAt: Date | null | undefined;

    if (request.status !== undefined && request.status === 'DONE') {
      completedAt = new Date();
    } else if (
      request.status !== undefined &&
      request.status !== 'DONE' &&
      existingCard.isCompleted
    ) {
      completedAt = null;
    }

    const updatedCard = await this.cardsRepository.update({
      id: cardId,
      boardId,
      title: title?.trim(),
      description: request.description,
      status: request.status,
      priority: request.priority,
      assigneeId: request.assigneeId,
      startDate: request.startDate,
      dueDate: request.dueDate,
      estimatedMinutes: request.estimatedMinutes,
      coverColor: request.coverColor,
      metadata: request.metadata,
      completedAt,
    });

    if (!updatedCard) {
      throw new ResourceNotFoundError('Card not found');
    }

    const cardTitle = title?.trim() ?? oldTitle;

    if (title !== undefined && title.trim() !== oldTitle) {
      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'UPDATED',
        description: `${userName} alterou o título do cartão de "${oldTitle}" para "${title.trim()}"`,
        field: 'title',
        oldValue: oldTitle,
        newValue: title.trim(),
      });
    }

    if (request.priority !== undefined && request.priority !== oldPriority) {
      const oldLabel = PRIORITY_LABELS[oldPriority] ?? oldPriority;
      const newLabel =
        PRIORITY_LABELS[request.priority] ?? request.priority;

      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'UPDATED',
        description: `${userName} alterou a prioridade do cartão ${cardTitle} de ${oldLabel} para ${newLabel}`,
        field: 'priority',
        oldValue: oldPriority,
        newValue: request.priority,
      });
    }

    if (request.status !== undefined && request.status !== oldStatus) {
      const oldLabel = STATUS_LABELS[oldStatus] ?? oldStatus;
      const newLabel = STATUS_LABELS[request.status] ?? request.status;

      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'UPDATED',
        description: `${userName} alterou o status do cartão ${cardTitle} de ${oldLabel} para ${newLabel}`,
        field: 'status',
        oldValue: oldStatus,
        newValue: request.status,
      });
    }

    return { card: cardToDTO(updatedCard) };
  }
}
