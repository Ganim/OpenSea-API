import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ChartOfAccount } from '@/entities/finance/chart-of-account';

export interface CreateChartOfAccountSchema {
  tenantId: string;
  code: string;
  name: string;
  type: string;
  accountClass: string;
  nature: string;
  parentId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface UpdateChartOfAccountSchema {
  id: UniqueEntityID;
  tenantId: string;
  code?: string;
  name?: string;
  type?: string;
  accountClass?: string;
  nature?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface FindManyChartOfAccountsPaginatedResult {
  chartOfAccounts: ChartOfAccount[];
  total: number;
}

export interface ChartOfAccountsRepository {
  create(data: CreateChartOfAccountSchema): Promise<ChartOfAccount>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ChartOfAccount | null>;
  findByCode(code: string, tenantId: string): Promise<ChartOfAccount | null>;
  findMany(tenantId: string): Promise<ChartOfAccount[]>;
  findManyPaginated(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<FindManyChartOfAccountsPaginatedResult>;
  findChildren(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<ChartOfAccount[]>;
  update(data: UpdateChartOfAccountSchema): Promise<ChartOfAccount | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
