import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Request } from '@/entities/requests/request';
import type {
  FindManyRequestsParams,
  RequestsRepository,
} from '../requests-repository';

export class InMemoryRequestsRepository implements RequestsRepository {
  public items: Request[] = [];

  async create(request: Request): Promise<void> {
    this.items.push(request);
  }

  async save(request: Request): Promise<void> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === request.id.toString(),
    );

    if (itemIndex >= 0) {
      this.items[itemIndex] = request;
    }
  }

  async findById(id: UniqueEntityID): Promise<Request | null> {
    const request = this.items.find(
      (item) => item.id.toString() === id.toString() && !item.isDeleted(),
    );

    return request ?? null;
  }

  async findMany(params: FindManyRequestsParams): Promise<Request[]> {
    let filtered = this.items.filter((item) => !item.isDeleted());

    // If userIdForOwnRequests is set, use OR condition
    if (params.userIdForOwnRequests) {
      filtered = filtered.filter(
        (item) =>
          item.requesterId.toString() === params.userIdForOwnRequests ||
          item.assignedToId?.toString() === params.userIdForOwnRequests,
      );
    } else {
      // Otherwise use specific filters if provided
      if (params.requesterId) {
        filtered = filtered.filter(
          (item) => item.requesterId.toString() === params.requesterId,
        );
      }

      if (params.assignedToId) {
        filtered = filtered.filter(
          (item) => item.assignedToId?.toString() === params.assignedToId,
        );
      }
    }

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    if (params.type) {
      filtered = filtered.filter((item) => item.type === params.type);
    }

    if (params.category) {
      filtered = filtered.filter((item) => item.category === params.category);
    }

    // Ordenar por prioridade (URGENT > HIGH > MEDIUM > LOW) e depois por data
    filtered.sort((a, b) => {
      const priorityWeight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff =
        priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return filtered.slice(start, end);
  }

  async countMany(
    params: Omit<FindManyRequestsParams, 'page' | 'limit'>,
  ): Promise<number> {
    let filtered = this.items.filter((item) => !item.isDeleted());

    // If userIdForOwnRequests is set, use OR condition
    if (params.userIdForOwnRequests) {
      filtered = filtered.filter(
        (item) =>
          item.requesterId.toString() === params.userIdForOwnRequests ||
          item.assignedToId?.toString() === params.userIdForOwnRequests,
      );
    } else {
      // Otherwise use specific filters if provided
      if (params.requesterId) {
        filtered = filtered.filter(
          (item) => item.requesterId.toString() === params.requesterId,
        );
      }

      if (params.assignedToId) {
        filtered = filtered.filter(
          (item) => item.assignedToId?.toString() === params.assignedToId,
        );
      }
    }

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    if (params.type) {
      filtered = filtered.filter((item) => item.type === params.type);
    }

    if (params.category) {
      filtered = filtered.filter((item) => item.category === params.category);
    }

    return filtered.length;
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
