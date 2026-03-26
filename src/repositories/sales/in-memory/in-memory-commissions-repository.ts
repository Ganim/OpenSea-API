import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CommissionRecord,
  CommissionsRepository,
  FindManyCommissionsParams,
} from '../commissions-repository';

export class InMemoryCommissionsRepository implements CommissionsRepository {
  public items: CommissionRecord[] = [];

  async findManyPaginated(
    params: FindManyCommissionsParams,
  ): Promise<PaginatedResult<CommissionRecord>> {
    let filtered = this.items.filter(
      (item) => item.tenantId === params.tenantId,
    );

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    if (params.userId) {
      filtered = filtered.filter((item) => item.userId === params.userId);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const commissions = filtered.slice(start, start + params.limit);

    return {
      data: commissions,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
