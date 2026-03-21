import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface ConvertQuoteUseCaseRequest {
  orderId: string;
  tenantId: string;
}

interface ConvertQuoteUseCaseResponse {
  order: Order;
}

export class ConvertQuoteUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    input: ConvertQuoteUseCaseRequest,
  ): Promise<ConvertQuoteUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    if (order.type !== 'QUOTE') {
      throw new BadRequestError('Only quotes can be converted to orders.');
    }

    order.type = 'ORDER';

    await this.ordersRepository.save(order);

    return { order };
  }
}
