import { Board } from '@/entities/tasks/board';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  BoardsRepository,
  CreateBoardSchema,
  UpdateBoardSchema,
  FindManyBoardsOptions,
  FindManyBoardsResult,
} from '../boards-repository';

export class InMemoryBoardsRepository implements BoardsRepository {
  public items: Board[] = [];

  async create(data: CreateBoardSchema): Promise<Board> {
    const board = Board.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      description: data.description,
      type: data.type,
      teamId: data.teamId ? new UniqueEntityID(data.teamId) : null,
      ownerId: new UniqueEntityID(data.ownerId),
      storageFolderId: data.storageFolderId,
      gradientId: data.gradientId,
      visibility: data.visibility,
      defaultView: data.defaultView,
      settings: data.settings,
      metadata: data.metadata,
      position: data.position,
    });

    this.items.push(board);
    return board;
  }

  async findById(id: string, tenantId: string): Promise<Board | null> {
    return (
      this.items.find(
        (board) =>
          board.id.toString() === id &&
          board.tenantId.toString() === tenantId &&
          !board.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    options: FindManyBoardsOptions,
  ): Promise<FindManyBoardsResult> {
    const filteredBoards = this.items.filter((board) => {
      if (board.tenantId.toString() !== options.tenantId) return false;
      if (board.deletedAt) return false;
      if (!options.includeArchived && board.archivedAt) return false;
      if (options.type && board.type !== options.type) return false;
      if (options.teamId && board.teamId?.toString() !== options.teamId)
        return false;
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        if (
          !board.title.toLowerCase().includes(searchLower) &&
          !board.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });

    const sortedBoards = filteredBoards.sort((a, b) => a.position - b.position);
    const total = sortedBoards.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const boards = sortedBoards.slice(startIndex, startIndex + limit);

    return { boards, total };
  }

  async findByTeamId(teamId: string, tenantId: string): Promise<Board[]> {
    return this.items.filter(
      (board) =>
        board.teamId?.toString() === teamId &&
        board.tenantId.toString() === tenantId &&
        !board.deletedAt,
    );
  }

  async update(data: UpdateBoardSchema): Promise<Board | null> {
    const board = this.items.find(
      (board) =>
        board.id.toString() === data.id &&
        board.tenantId.toString() === data.tenantId &&
        !board.deletedAt,
    );
    if (!board) return null;

    if (data.title !== undefined) board.title = data.title;
    if (data.description !== undefined) board.description = data.description;
    if (data.visibility !== undefined) board.visibility = data.visibility;
    if (data.defaultView !== undefined) board.defaultView = data.defaultView;
    if (data.storageFolderId !== undefined)
      board.storageFolderId = data.storageFolderId;
    if (data.gradientId !== undefined) board.gradientId = data.gradientId;
    if (data.settings !== undefined) board.settings = data.settings;
    if (data.metadata !== undefined) board.metadata = data.metadata;
    if (data.position !== undefined) board.position = data.position;

    return board;
  }

  async archive(id: string, tenantId: string): Promise<void> {
    const board = this.items.find(
      (board) =>
        board.id.toString() === id &&
        board.tenantId.toString() === tenantId &&
        !board.deletedAt,
    );
    if (board) {
      board.archive();
    }
  }

  async restore(id: string, tenantId: string): Promise<void> {
    const board = this.items.find(
      (board) =>
        board.id.toString() === id &&
        board.tenantId.toString() === tenantId &&
        !board.deletedAt,
    );
    if (board) {
      board.restore();
    }
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const board = this.items.find(
      (board) =>
        board.id.toString() === id && board.tenantId.toString() === tenantId,
    );
    if (board) {
      board.delete();
    }
  }

  async reorder(
    id: string,
    tenantId: string,
    newPosition: number,
  ): Promise<void> {
    const board = this.items.find(
      (board) =>
        board.id.toString() === id &&
        board.tenantId.toString() === tenantId &&
        !board.deletedAt,
    );
    if (board) {
      board.position = newPosition;
    }
  }
}
