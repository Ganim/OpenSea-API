import { randomUUID } from 'node:crypto';
import type {
  BoardLabelsRepository,
  BoardLabelRecord,
  CreateBoardLabelSchema,
  UpdateBoardLabelSchema,
} from '../board-labels-repository';

export class InMemoryBoardLabelsRepository implements BoardLabelsRepository {
  public items: BoardLabelRecord[] = [];

  async create(data: CreateBoardLabelSchema): Promise<BoardLabelRecord> {
    const label: BoardLabelRecord = {
      id: randomUUID(),
      boardId: data.boardId,
      name: data.name,
      color: data.color,
      position: data.position ?? 0,
      createdAt: new Date(),
    };

    this.items.push(label);
    return label;
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardLabelRecord | null> {
    return (
      this.items.find(
        (label) => label.id === id && label.boardId === boardId,
      ) ?? null
    );
  }

  async findByBoardId(boardId: string): Promise<BoardLabelRecord[]> {
    return this.items
      .filter((label) => label.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  }

  async update(
    data: UpdateBoardLabelSchema,
  ): Promise<BoardLabelRecord | null> {
    const label = this.items.find(
      (label) => label.id === data.id && label.boardId === data.boardId,
    );
    if (!label) return null;

    if (data.name !== undefined) label.name = data.name;
    if (data.color !== undefined) label.color = data.color;
    if (data.position !== undefined) label.position = data.position;

    return label;
  }

  async delete(id: string, boardId: string): Promise<void> {
    this.items = this.items.filter(
      (label) => !(label.id === id && label.boardId === boardId),
    );
  }
}
