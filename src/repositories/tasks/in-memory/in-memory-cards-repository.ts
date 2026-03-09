import { Card } from '@/entities/tasks/card';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CardsRepository,
  CreateCardSchema,
  UpdateCardSchema,
  FindManyCardsOptions,
  FindManyCardsResult,
  CardWithLabelIds,
  OverdueCardRecord,
} from '../cards-repository';

export class InMemoryCardsRepository implements CardsRepository {
  public items: Card[] = [];
  public cardLabelAssignments: Map<string, string[]> = new Map();
  public boardTenantMap: Map<string, string> = new Map();

  async create(data: CreateCardSchema): Promise<Card> {
    const card = Card.create({
      boardId: new UniqueEntityID(data.boardId),
      columnId: new UniqueEntityID(data.columnId),
      parentCardId: data.parentCardId
        ? new UniqueEntityID(data.parentCardId)
        : null,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      position: data.position,
      assigneeId: data.assigneeId ? new UniqueEntityID(data.assigneeId) : null,
      reporterId: new UniqueEntityID(data.reporterId),
      startDate: data.startDate,
      dueDate: data.dueDate,
      estimatedMinutes: data.estimatedMinutes,
      coverColor: data.coverColor,
      coverImageId: data.coverImageId,
      metadata: data.metadata,
      systemSourceType: data.systemSourceType,
      systemSourceId: data.systemSourceId,
    });

    this.items.push(card);

    if (data.labelIds && data.labelIds.length > 0) {
      this.cardLabelAssignments.set(card.id.toString(), [...data.labelIds]);
    }

    return card;
  }

  async findById(id: string, boardId: string): Promise<Card | null> {
    return (
      this.items.find(
        (card) =>
          card.id.toString() === id &&
          card.boardId.toString() === boardId &&
          !card.deletedAt,
      ) ?? null
    );
  }

  async findByIdWithLabels(
    id: string,
    boardId: string,
  ): Promise<CardWithLabelIds | null> {
    const card = await this.findById(id, boardId);
    if (!card) return null;

    const labelIds = this.cardLabelAssignments.get(card.id.toString()) ?? [];
    return { card, labelIds };
  }

  async findMany(options: FindManyCardsOptions): Promise<FindManyCardsResult> {
    const filteredCards = this.items.filter((card) => {
      if (card.boardId.toString() !== options.boardId) return false;
      if (card.deletedAt) return false;
      if (!options.includeArchived && card.archivedAt) return false;
      if (options.columnId && card.columnId.toString() !== options.columnId)
        return false;
      if (options.parentCardId !== undefined) {
        if (options.parentCardId === null && card.parentCardId !== null)
          return false;
        if (
          options.parentCardId !== null &&
          card.parentCardId?.toString() !== options.parentCardId
        )
          return false;
      }
      if (
        options.assigneeId &&
        card.assigneeId?.toString() !== options.assigneeId
      )
        return false;
      if (
        options.reporterId &&
        card.reporterId.toString() !== options.reporterId
      )
        return false;
      if (options.status && card.status !== options.status) return false;
      if (options.priority && card.priority !== options.priority) return false;
      if (options.startDate && card.dueDate && card.dueDate < options.startDate)
        return false;
      if (options.endDate && card.startDate && card.startDate > options.endDate)
        return false;
      if (options.labelIds && options.labelIds.length > 0) {
        const cardLabels =
          this.cardLabelAssignments.get(card.id.toString()) ?? [];
        const hasMatchingLabel = options.labelIds.some((labelId) =>
          cardLabels.includes(labelId),
        );
        if (!hasMatchingLabel) return false;
      }
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        if (
          !card.title.toLowerCase().includes(searchLower) &&
          !card.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });

    const sortedCards = filteredCards.sort((a, b) => a.position - b.position);
    const total = sortedCards.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const cards = sortedCards.slice(startIndex, startIndex + limit);

    return { cards, total };
  }

  async findBySystemSource(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<Card | null> {
    return (
      this.items.find(
        (card) =>
          card.systemSourceType === sourceType &&
          card.systemSourceId === sourceId &&
          !card.deletedAt,
      ) ?? null
    );
  }

  async findSubtasks(parentCardId: string): Promise<Card[]> {
    return this.items
      .filter(
        (card) =>
          card.parentCardId?.toString() === parentCardId && !card.deletedAt,
      )
      .sort((a, b) => a.position - b.position);
  }

  async countByColumnId(columnId: string): Promise<number> {
    return this.items.filter(
      (card) => card.columnId.toString() === columnId && !card.deletedAt,
    ).length;
  }

  async getNextPosition(columnId: string): Promise<number> {
    const cards = this.items.filter(
      (card) => card.columnId.toString() === columnId && !card.deletedAt,
    );
    if (cards.length === 0) return 0;
    return Math.max(...cards.map((c) => c.position)) + 1;
  }

  async findCardsDueSoon(beforeDate: Date): Promise<OverdueCardRecord[]> {
    return this.items
      .filter(
        (card) =>
          !card.deletedAt &&
          !card.archivedAt &&
          card.dueDate &&
          card.dueDate <= beforeDate &&
          card.status !== 'DONE' &&
          card.status !== 'CANCELED',
      )
      .map((card) => ({
        id: card.id.toString(),
        boardId: card.boardId.toString(),
        tenantId: this.boardTenantMap.get(card.boardId.toString()) ?? '',
        title: card.title,
        dueDate: card.dueDate!,
        assigneeId: card.assigneeId?.toString() ?? null,
        reporterId: card.reporterId.toString(),
        status: card.status,
      }));
  }

  async update(data: UpdateCardSchema): Promise<Card | null> {
    const card = this.items.find(
      (card) =>
        card.id.toString() === data.id &&
        card.boardId.toString() === data.boardId &&
        !card.deletedAt,
    );
    if (!card) return null;

    if (data.columnId !== undefined)
      card.columnId = new UniqueEntityID(data.columnId);
    if (data.title !== undefined) card.title = data.title;
    if (data.description !== undefined) card.description = data.description;
    if (data.status !== undefined) card.status = data.status;
    if (data.priority !== undefined) card.priority = data.priority;
    if (data.position !== undefined) card.position = data.position;
    if (data.assigneeId !== undefined)
      card.assigneeId = data.assigneeId
        ? new UniqueEntityID(data.assigneeId)
        : null;
    if (data.startDate !== undefined) card.startDate = data.startDate;
    if (data.dueDate !== undefined) card.dueDate = data.dueDate;
    if (data.estimatedMinutes !== undefined)
      card.estimatedMinutes = data.estimatedMinutes;
    if (data.coverColor !== undefined) card.coverColor = data.coverColor;
    if (data.coverImageId !== undefined) card.coverImageId = data.coverImageId;
    if (data.metadata !== undefined) card.metadata = data.metadata;
    if (data.completedAt !== undefined) {
      const internal = card as unknown as {
        props: { completedAt: Date | null; updatedAt: Date | null };
      };
      internal.props.completedAt = data.completedAt;
      internal.props.updatedAt = new Date();
    }
    if (data.archivedAt !== undefined) {
      if (data.archivedAt) {
        card.archive();
      } else {
        card.restore();
      }
    }
    if (data.labelIds !== undefined) {
      this.cardLabelAssignments.set(card.id.toString(), [...data.labelIds]);
    }

    return card;
  }

  async updateManyColumn(
    cardIds: string[],
    boardId: string,
    columnId: string,
  ): Promise<void> {
    for (const card of this.items) {
      if (
        cardIds.includes(card.id.toString()) &&
        card.boardId.toString() === boardId
      ) {
        card.columnId = new UniqueEntityID(columnId);
      }
    }
  }

  async softDelete(id: string, boardId: string): Promise<void> {
    const card = this.items.find(
      (card) =>
        card.id.toString() === id && card.boardId.toString() === boardId,
    );
    if (card) {
      card.delete();
    }
  }

  async softDeleteMany(ids: string[], boardId: string): Promise<void> {
    for (const id of ids) {
      await this.softDelete(id, boardId);
    }
  }
}
