import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface GetCashierQueueUseCaseRequest {
  tenantId: string;
  terminalId: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface GetCashierQueueUseCaseResponse {
  orders: PaginatedResult<Order>;
}

export class GetCashierQueueUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private posTerminalsRepository: PosTerminalsRepository,
  ) {}

  async execute(
    input: GetCashierQueueUseCaseRequest,
  ): Promise<GetCashierQueueUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(input.terminalId),
      input.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    if (terminal.mode === 'SALES_ONLY') {
      throw new ForbiddenError(
        'SALES_ONLY terminals cannot consume the cashier queue.',
      );
    }

    if (terminal.mode === 'TOTEM') {
      throw new ForbiddenError(
        'TOTEM terminals cannot consume the cashier queue.',
      );
    }

    if (terminal.mode === 'CASHIER') {
      // CASHIER pulls awaiting-payment orders from all SALES_ONLY terminals.
      const sales = await this.ordersRepository.findCashierQueue(
        input.tenantId,
        {
          search: input.search,
          page: input.page,
          limit: input.limit,
          terminalIds: await this.listSalesOnlyTerminalIds(input.tenantId),
        },
      );
      return { orders: sales };
    }

    // SALES_WITH_CHECKOUT — only sees its own pending orders.
    const orders = await this.ordersRepository.findCashierQueue(
      input.tenantId,
      {
        search: input.search,
        page: input.page,
        limit: input.limit,
        terminalId: input.terminalId,
      },
    );

    return { orders };
  }

  private async listSalesOnlyTerminalIds(tenantId: string): Promise<string[]> {
    const result = await this.posTerminalsRepository.findManyPaginated({
      tenantId,
      page: 1,
      limit: 1000,
      mode: 'SALES_ONLY',
      isActive: true,
    });
    return result.data.map((t) => t.id.toString());
  }
}
