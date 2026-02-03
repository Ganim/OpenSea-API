import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrdersRepository } from '@/repositories/sales/sales-orders-repository';

interface CancelSalesOrderUseCaseRequest {
  tenantId: string;
  id: string;
}

interface CancelSalesOrderUseCaseResponse {
  message: string;
}

export class CancelSalesOrderUseCase {
  constructor(private salesOrdersRepository: SalesOrdersRepository) {}

  async execute(
    input: CancelSalesOrderUseCaseRequest,
  ): Promise<CancelSalesOrderUseCaseResponse> {
    const order = await this.salesOrdersRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Sales order not found.');
    }

    if (order.status.isFinal) {
      throw new BadRequestError('Cannot cancel order in final status.');
    }

    order.cancel();
    await this.salesOrdersRepository.save(order);

    return {
      message: 'Sales order cancelled successfully.',
    };
  }
}
