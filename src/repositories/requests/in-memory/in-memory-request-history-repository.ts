import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '../request-history-repository';

export class InMemoryRequestHistoryRepository
  implements RequestHistoryRepository
{
  public items: RequestHistory[] = [];

  async create(history: RequestHistory): Promise<void> {
    this.items.push(history);
  }

  async findManyByRequestId(
    requestId: UniqueEntityID,
  ): Promise<RequestHistory[]> {
    return this.items
      .filter((item) => item.requestId.toString() === requestId.toString())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Mais recente primeiro
  }
}
