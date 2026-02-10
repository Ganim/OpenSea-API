import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Consortium } from '@/entities/finance/consortium';

export interface CreateConsortiumSchema {
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  administrator: string;
  groupNumber?: string;
  quotaNumber?: string;
  contractNumber?: string;
  creditValue: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments?: number;
  isContemplated?: boolean;
  startDate: Date;
  endDate?: Date;
  paymentDay?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateConsortiumSchema {
  id: UniqueEntityID;
  name?: string;
  administrator?: string;
  contractNumber?: string | null;
  status?: string;
  paidInstallments?: number;
  isContemplated?: boolean;
  contemplatedAt?: Date | null;
  contemplationType?: string | null;
  notes?: string | null;
  endDate?: Date | null;
}

export interface FindManyConsortiaOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  bankAccountId?: string;
  costCenterId?: string;
  status?: string;
  isContemplated?: boolean;
  search?: string;
}

export interface FindManyConsortiaResult {
  consortia: Consortium[];
  total: number;
}

export interface ConsortiaRepository {
  create(data: CreateConsortiumSchema): Promise<Consortium>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Consortium | null>;
  findMany(options: FindManyConsortiaOptions): Promise<FindManyConsortiaResult>;
  update(data: UpdateConsortiumSchema): Promise<Consortium | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
