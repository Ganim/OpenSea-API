import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contract } from '@/entities/finance/contract';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateContractSchema {
  tenantId: string;
  code: string;
  title: string;
  description?: string;
  status?: string;
  companyId?: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  totalValue: number;
  paymentFrequency: string;
  paymentAmount: number;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew?: boolean;
  renewalPeriodMonths?: number;
  alertDaysBefore?: number;
  folderPath?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateContractSchema {
  id: UniqueEntityID;
  tenantId?: string;
  title?: string;
  description?: string | null;
  status?: string;
  companyId?: string | null;
  companyName?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  totalValue?: number;
  paymentFrequency?: string;
  paymentAmount?: number;
  categoryId?: string | null;
  costCenterId?: string | null;
  bankAccountId?: string | null;
  endDate?: Date;
  autoRenew?: boolean;
  renewalPeriodMonths?: number | null;
  alertDaysBefore?: number;
  folderPath?: string | null;
  notes?: string | null;
}

export interface FindManyContractsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  companyName?: string;
  companyId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  search?: string;
}

export interface FindManyContractsResult {
  contracts: Contract[];
  total: number;
}

export interface ContractsRepository {
  create(data: CreateContractSchema, tx?: TransactionClient): Promise<Contract>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Contract | null>;
  findMany(options: FindManyContractsOptions): Promise<FindManyContractsResult>;
  findByCompanyId(companyId: string, tenantId: string): Promise<Contract[]>;
  findByCompanyName(companyName: string, tenantId: string): Promise<Contract[]>;
  update(data: UpdateContractSchema): Promise<Contract | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
