import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrdersRepository } from '@/repositories/sales/sales-orders-repository';

interface GetSalesOrderByIdUseCaseRequest {
  id: string;
}

interface GetSalesOrderByIdUseCaseResponse {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    customerId: string;
    createdBy: string | null;
    totalPrice: number;
    discount: number;
    finalPrice: number;
    notes: string | null;
    items: Array<{
      id: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      totalPrice: number;
      notes: string | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class GetSalesOrderByIdUseCase {
  constructor(private salesOrdersRepository: SalesOrdersRepository) {}

  async execute(
    input: GetSalesOrderByIdUseCaseRequest,
  ): Promise<GetSalesOrderByIdUseCaseResponse> {
    const order = await this.salesOrdersRepository.findById(
      new UniqueEntityID(input.id),
    );

    if (!order) {
      throw new ResourceNotFoundError('Sales order not found.');
    }

    return {
      order: {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        status: order.status.value,
        customerId: order.customerId.toString(),
        createdBy: order.createdBy?.toString() ?? null,
        totalPrice: order.totalPrice,
        discount: order.discount,
        finalPrice: order.finalPrice,
        notes: order.notes ?? null,
        items: order.items.map((item) => ({
          id: item.id.toString(),
          variantId: item.variantId.toString(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          totalPrice: item.totalPrice,
          notes: item.notes ?? null,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? order.createdAt,
      },
    };
  }
}
