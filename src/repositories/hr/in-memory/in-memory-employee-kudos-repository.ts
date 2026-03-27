import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type {
  EmployeeKudosRepository,
  PaginatedKudosResult,
} from '../employee-kudos-repository';

export class InMemoryEmployeeKudosRepository
  implements EmployeeKudosRepository
{
  public items: EmployeeKudos[] = [];

  async create(kudos: EmployeeKudos): Promise<void> {
    this.items.push(kudos);
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
  ): Promise<PaginatedKudosResult> {
    const filtered = this.items
      .filter(
        (item) =>
          item.tenantId.toString() === tenantId && item.isPublic,
      )
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

    return {
      kudos: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }
}
