import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';

export interface PaginatedKudosResult {
  kudos: EmployeeKudos[];
  total: number;
}

export interface ListPublicKudosFeedFilters {
  pinned?: boolean;
}

export interface EmployeeKudosRepository {
  create(kudos: EmployeeKudos): Promise<void>;
  findById(
    kudosId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeKudos | null>;
  save(kudos: EmployeeKudos): Promise<void>;
  findManyByRecipient(
    toEmployeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult>;
  findManyBySender(
    fromEmployeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult>;
  findManyPublicFeed(
    tenantId: string,
    skip: number,
    take: number,
    filters?: ListPublicKudosFeedFilters,
  ): Promise<PaginatedKudosResult>;
}
