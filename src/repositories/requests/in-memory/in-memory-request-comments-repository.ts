import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestComment } from '@/entities/requests/request-comment';
import type { RequestCommentsRepository } from '../request-comments-repository';

export class InMemoryRequestCommentsRepository
  implements RequestCommentsRepository
{
  public items: RequestComment[] = [];

  async create(comment: RequestComment): Promise<void> {
    this.items.push(comment);
  }

  async save(comment: RequestComment): Promise<void> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === comment.id.toString(),
    );

    if (itemIndex >= 0) {
      this.items[itemIndex] = comment;
    }
  }

  async findById(id: UniqueEntityID): Promise<RequestComment | null> {
    const comment = this.items.find(
      (item) => item.id.toString() === id.toString() && !item.isDeleted(),
    );

    return comment ?? null;
  }

  async findManyByRequestId(
    requestId: UniqueEntityID,
  ): Promise<RequestComment[]> {
    return this.items
      .filter(
        (item) =>
          item.requestId.toString() === requestId.toString() &&
          !item.isDeleted(),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === id.toString(),
    );

    if (itemIndex >= 0) {
      this.items[itemIndex].softDelete();
    }
  }
}
