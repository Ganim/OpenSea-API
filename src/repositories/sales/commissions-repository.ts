import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CommissionRecord {
  id: string;
  tenantId: string;
  orderId: string;
  userId: string;
  baseValue: number;
  commissionType: string;
  commissionRate: number;
  commissionValue: number;
  status: string;
  paidAt: Date | null;
  financeEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindManyCommissionsParams {
  tenantId: string;
  page: number;
  limit: number;
  status?: string;
  userId?: string;
  search?: string;
}

export interface CommissionsRepository {
  findManyPaginated(
    params: FindManyCommissionsParams,
  ): Promise<PaginatedResult<CommissionRecord>>;
}
