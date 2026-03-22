import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentCondition } from '@/entities/sales/payment-condition';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyPaymentConditionsParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

export interface PaymentConditionsRepository {
  create(condition: PaymentCondition): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PaymentCondition | null>;
  findDefault(tenantId: string): Promise<PaymentCondition | null>;
  findManyPaginated(
    params: FindManyPaymentConditionsParams,
  ): Promise<PaginatedResult<PaymentCondition>>;
  save(condition: PaymentCondition): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
