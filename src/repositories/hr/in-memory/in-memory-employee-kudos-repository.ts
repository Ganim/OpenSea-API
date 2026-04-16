import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type {
  EmployeeKudosRepository,
  ListPublicKudosFeedFilters,
  PaginatedKudosResult,
} from '../employee-kudos-repository';

export class InMemoryEmployeeKudosRepository
  implements EmployeeKudosRepository
{
  public items: EmployeeKudos[] = [];

  async create(kudos: EmployeeKudos): Promise<void> {
    this.items.push(kudos);
  }

  async findById(
    kudosId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeKudos | null> {
    const found = this.items.find(
      (item) =>
        item.id.equals(kudosId) && item.tenantId.toString() === tenantId,
    );

    return found ?? null;
  }

  async save(kudos: EmployeeKudos): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(kudos.id));
    if (index >= 0) {
      this.items[index] = kudos;
    }
  }

  async findManyByRecipient(
    toEmployeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult> {
    const filtered = this.items.filter(
      (item) =>
        item.toEmployeeId.equals(toEmployeeId) &&
        item.tenantId.toString() === tenantId,
    );

    return {
      kudos: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async findManyBySender(
    fromEmployeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult> {
    const filtered = this.items.filter(
      (item) =>
        item.fromEmployeeId.equals(fromEmployeeId) &&
        item.tenantId.toString() === tenantId,
    );

    return {
      kudos: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async findManyPublicFeed(
    tenantId: string,
    skip: number,
    take: number,
    filters?: ListPublicKudosFeedFilters,
  ): Promise<PaginatedKudosResult> {
    const filtered = this.items
      .filter((item) => item.tenantId.toString() === tenantId && item.isPublic)
      .filter((item) =>
        filters?.pinned === undefined ? true : item.isPinned === filters.pinned,
      )
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        if (a.isPinned && b.isPinned) {
          const aPin = a.pinnedAt?.getTime() ?? 0;
          const bPin = b.pinnedAt?.getTime() ?? 0;
          if (aPin !== bPin) return bPin - aPin;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    return {
      kudos: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }
}
