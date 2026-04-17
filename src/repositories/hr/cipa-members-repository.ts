import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMember } from '@/entities/hr/cipa-member';

export interface CreateCipaMemberSchema {
  tenantId: string;
  mandateId: UniqueEntityID;
  employeeId: UniqueEntityID;
  role: string;
  type: string;
  isStable?: boolean;
  stableUntil?: Date;
}

export interface FindCipaMemberFilters {
  mandateId?: UniqueEntityID;
  employeeId?: UniqueEntityID;
  page?: number;
  perPage?: number;
}

export interface CipaMembersRepository {
  create(data: CreateCipaMemberSchema): Promise<CipaMember>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CipaMember | null>;
  findByMandateAndEmployee(
    mandateId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember | null>;
  findMany(
    tenantId: string,
    filters?: FindCipaMemberFilters,
  ): Promise<CipaMember[]>;
  findActiveByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember[]>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
