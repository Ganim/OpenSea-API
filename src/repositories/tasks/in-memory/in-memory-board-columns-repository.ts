import { randomUUID } from 'node:crypto';
import type {
  BoardColumnsRepository,
  BoardColumnRecord,
  CreateBoardColumnSchema,
  UpdateBoardColumnSchema,
} from '../board-columns-repository';

export class InMemoryBoardColumnsRepository
  implements BoardColumnsRepository
{
  public items: BoardColumnRecord[] = [];

  async create(data: CreateBoardColumnSchema): Promise<BoardColumnRecord> {
    const now = new Date();
    const column: BoardColumnRecord = {
      id: randomUUID(),
      boardId: data.boardId,
      title: data.title,
      color: data.color ?? null,
      position: data.position ?? 0,
      isDefault: data.isDefault ?? false,
      isDone: data.isDone ?? false,
      wipLimit: data.wipLimit ?? null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(column);
    return column;
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardColumnRecord | null> {
    return (
      this.items.find(
        (column) => column.id === id && column.boardId === boardId,
      ) ?? null
    );
  }

  async findByBoardId(boardId: string): Promise<BoardColumnRecord[]> {
    return this.items
      .filter(
        (column) => column.boardId === boardId && !column.archivedAt,
      )
      .sort((a, b) => a.position - b.position);
  }

  async findDefaultColumn(
    boardId: string,
  ): Promise<BoardColumnRecord | null> {
    return (
      this.items.find(
        (column) =>
          column.boardId === boardId &&
          column.isDefault &&
          !column.archivedAt,
      ) ?? null
    );
  }

  async findDoneColumn(boardId: string): Promise<BoardColumnRecord | null> {
    return (
      this.items.find(
        (column) =>
          column.boardId === boardId &&
          column.isDone &&
          !column.archivedAt,
      ) ?? null
    );
  }

  async update(
    data: UpdateBoardColumnSchema,
  ): Promise<BoardColumnRecord | null> {
    const column = this.items.find(
      (column) => column.id === data.id && column.boardId === data.boardId,
    );
    if (!column) return null;

    if (data.title !== undefined) column.title = data.title;
    if (data.color !== undefined) column.color = data.color ?? null;
    if (data.position !== undefined) column.position = data.position;
    if (data.isDefault !== undefined) column.isDefault = data.isDefault;
    if (data.isDone !== undefined) column.isDone = data.isDone;
    if (data.wipLimit !== undefined) column.wipLimit = data.wipLimit ?? null;
    column.updatedAt = new Date();

    return column;
  }

  async archive(id: string, boardId: string): Promise<void> {
    const column = this.items.find(
      (column) => column.id === id && column.boardId === boardId,
    );
    if (column) {
      column.archivedAt = new Date();
      column.updatedAt = new Date();
    }
  }

  async restore(id: string, boardId: string): Promise<void> {
    const column = this.items.find(
      (column) => column.id === id && column.boardId === boardId,
    );
    if (column) {
      column.archivedAt = null;
      column.updatedAt = new Date();
    }
  }

  async delete(id: string, boardId: string): Promise<void> {
    this.items = this.items.filter(
      (column) => !(column.id === id && column.boardId === boardId),
    );
  }

  async reorder(
    id: string,
    boardId: string,
    newPosition: number,
  ): Promise<void> {
    const column = this.items.find(
      (column) => column.id === id && column.boardId === boardId,
    );
    if (column) {
      column.position = newPosition;
      column.updatedAt = new Date();
    }
  }
}
