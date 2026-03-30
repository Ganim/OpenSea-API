import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TaxObligation,
  TaxObligationStatus,
  TaxType,
} from '@/entities/finance/tax-obligation';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateTaxObligationSchema {
  tenantId: string;
  taxType: TaxType;
  referenceMonth: number;
  referenceYear: number;
  dueDate: Date;
  amount: number;
  darfCode?: string;
}

export interface FindManyTaxObligationsOptions {
  tenantId: string;
  year?: number;
  month?: number;
  status?: TaxObligationStatus;
  taxType?: TaxType;
  page?: number;
  limit?: number;
}

export interface FindManyTaxObligationsResult {
  obligations: TaxObligation[];
  total: number;
}

export interface TaxObligationsRepository {
  create(
    data: CreateTaxObligationSchema,
    tx?: TransactionClient,
  ): Promise<TaxObligation>;

  createMany(
    data: CreateTaxObligationSchema[],
    tx?: TransactionClient,
  ): Promise<TaxObligation[]>;

  findById(id: UniqueEntityID, tenantId: string): Promise<TaxObligation | null>;

  findByTaxTypeAndPeriod(
    tenantId: string,
    taxType: TaxType,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<TaxObligation | null>;

  findMany(
    options: FindManyTaxObligationsOptions,
  ): Promise<FindManyTaxObligationsResult>;

  update(obligation: TaxObligation, tx?: TransactionClient): Promise<void>;

  delete(id: UniqueEntityID, tenantId: string): Promise<void>;

  sumPendingByYear(tenantId: string, year: number): Promise<number>;
}
