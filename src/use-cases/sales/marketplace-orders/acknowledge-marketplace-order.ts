import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceOrderDTO } from '@/mappers/sales/marketplace/marketplace-order-to-dto';
import { marketplaceOrderToDTO } from '@/mappers/sales/marketplace/marketplace-order-to-dto';
import type { MarketplaceOrdersRepository } from '@/repositories/sales/marketplace-orders-repository';

interface AcknowledgeMarketplaceOrderUseCaseRequest {
  tenantId: string;
  id: string;
}

interface AcknowledgeMarketplaceOrderUseCaseResponse {
  order: MarketplaceOrderDTO;
}

export class AcknowledgeMarketplaceOrderUseCase {
  constructor(private ordersRepository: MarketplaceOrdersRepository) {}

  async execute(
    input: AcknowledgeMarketplaceOrderUseCaseRequest,
  ): Promise<AcknowledgeMarketplaceOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    if (order.status !== 'RECEIVED') {
      throw new BadRequestError(
        'Only orders with status RECEIVED can be acknowledged.',
      );
    }

    order.acknowledge();
    await this.ordersRepository.save(order);

    return { order: marketplaceOrderToDTO(order) };
  }
}
