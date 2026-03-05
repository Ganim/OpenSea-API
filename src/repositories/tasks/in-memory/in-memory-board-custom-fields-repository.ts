import { randomUUID } from 'node:crypto';
import type {
  BoardCustomFieldsRepository,
  BoardCustomFieldRecord,
  CreateBoardCustomFieldSchema,
  UpdateBoardCustomFieldSchema,
} from '../board-custom-fields-repository';

export class InMemoryBoardCustomFieldsRepository
  implements BoardCustomFieldsRepository
{
  public items: BoardCustomFieldRecord[] = [];

  async create(
    data: CreateBoardCustomFieldSchema,
  ): Promise<BoardCustomFieldRecord> {
    const now = new Date();
    const customField: BoardCustomFieldRecord = {
      id: randomUUID(),
      boardId: data.boardId,
      name: data.name,
      type: data.type,
      options: data.options ?? null,
      position: data.position ?? 0,
      isRequired: data.isRequired ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(customField);
    return customField;
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardCustomFieldRecord | null> {
    return (
      this.items.find(
        (field) => field.id === id && field.boardId === boardId,
      ) ?? null
    );
  }

  async findByBoardId(boardId: string): Promise<BoardCustomFieldRecord[]> {
    return this.items
      .filter((field) => field.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  }

  async update(
    data: UpdateBoardCustomFieldSchema,
  ): Promise<BoardCustomFieldRecord | null> {
    const field = this.items.find(
      (field) => field.id === data.id && field.boardId === data.boardId,
    );
    if (!field) return null;

    if (data.name !== undefined) field.name = data.name;
    if (data.type !== undefined) field.type = data.type;
    if (data.options !== undefined) field.options = data.options ?? null;
    if (data.position !== undefined) field.position = data.position;
    if (data.isRequired !== undefined) field.isRequired = data.isRequired;
    field.updatedAt = new Date();

    return field;
  }

  async delete(id: string, boardId: string): Promise<void> {
    this.items = this.items.filter(
      (field) => !(field.id === id && field.boardId === boardId),
    );
  }
}
