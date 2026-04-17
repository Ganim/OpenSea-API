import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Consortium } from '@/entities/finance/consortium';
import type { TransactionClient } from '@/lib/transaction-manager';

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
  tenantId?: string;
  name?: string;
  administrator?: string;
  // P1-39: extended with every field the create form also collects, mirrored
  // from the CreateConsortiumSchema except creditValue (immutable once the
  // consortium has paid installments).
  bankAccountId?: string;
  costCenterId?: string;
  monthlyPayment?: number;
  totalInstallments?: number;
  startDate?: Date;
  paymentDay?: number | null;
  groupNumber?: string | null;
  quotaNumber?: string | null;
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
  sortBy?: 'createdAt' | 'monthlyPayment' | 'administrator' | 'status';
  sortOrder?: 'asc' | 'desc';
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
  create(
    data: CreateConsortiumSchema,
    tx?: TransactionClient,
  ): Promise<Consortium>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Consortium | null>;
  findMany(options: FindManyConsortiaOptions): Promise<FindManyConsortiaResult>;
  update(
    data: UpdateConsortiumSchema,
    tx?: TransactionClient,
  ): Promise<Consortium | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
