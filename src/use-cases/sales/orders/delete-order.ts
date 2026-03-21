import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface DeleteOrderUseCaseRequest {
  orderId: string;
  tenantId: string;
}

export class DeleteOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(input: DeleteOrderUseCaseRequest): Promise<void> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    await this.ordersRepository.delete(order.id, input.tenantId);
  }
}
