import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMandate } from '@/entities/hr/cipa-mandate';

export interface CreateCipaMandateSchema {
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  electionDate?: Date;
  notes?: string;
}

export interface UpdateCipaMandateSchema {
  id: UniqueEntityID;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  electionDate?: Date;
  notes?: string;
}

export interface FindCipaMandateFilters {
  status?: string;
  page?: number;
  perPage?: number;
}

export interface CipaMandatesRepository {
  create(data: CreateCipaMandateSchema): Promise<CipaMandate>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CipaMandate | null>;
  findMany(
    tenantId: string,
    filters?: FindCipaMandateFilters,
  ): Promise<CipaMandate[]>;
  update(data: UpdateCipaMandateSchema): Promise<CipaMandate | null>;
  delete(id: UniqueEntityID): Promise<void>;
  countMembers(mandateId: UniqueEntityID): Promise<number>;
}
