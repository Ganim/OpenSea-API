import type {
  InventorySession,
  InventorySessionMode,
  InventorySessionStatus,
} from '@/entities/stock/inventory-session';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';

interface ListInventorySessionsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  status?: InventorySessionStatus;
  mode?: InventorySessionMode;
}

interface ListInventorySessionsUseCaseResponse {
  sessions: PaginatedResult<InventorySession>;
}

export class ListInventorySessionsUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
  ) {}

  async execute(
    input: ListInventorySessionsUseCaseRequest,
  ): Promise<ListInventorySessionsUseCaseResponse> {
    const sessions = await this.inventorySessionsRepository.findManyPaginated(
      input.tenantId,
      { page: input.page, limit: input.limit },
      {
        status: input.status,
        mode: input.mode,
      },
    );

    return { sessions };
  }
}
