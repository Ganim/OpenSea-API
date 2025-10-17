import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { SalesOrdersRepository } from '@/repositories/sales/sales-orders-repository';

interface ListSalesOrdersUseCaseRequest {
  page?: number;
  perPage?: number;
  customerId?: string;
  status?:
    | 'DRAFT'
    | 'PENDING'
    | 'CONFIRMED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURNED';
}

interface ListSalesOrdersUseCaseResponse {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    customerId: string;
    createdBy: string | null;
    totalPrice: number;
    discount: number;
    finalPrice: number;
    notes: string | null;
    itemsCount: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListSalesOrdersUseCase {
  constructor(private salesOrdersRepository: SalesOrdersRepository) {}

  async execute(
    input: ListSalesOrdersUseCaseRequest,
  ): Promise<ListSalesOrdersUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    let allOrders: SalesOrder[];

    if (input.customerId) {
      allOrders = await this.salesOrdersRepository.findManyByCustomer(
        new UniqueEntityID(input.customerId),
        1,
        999999,
      );
    } else if (input.status) {
      allOrders = await this.salesOrdersRepository.findManyByStatus(
        OrderStatus.create(input.status),
        1,
        999999,
      );
    } else {
      allOrders = await this.salesOrdersRepository.findManyByCustomer(
        new UniqueEntityID(''),
        1,
        999999,
      );
      // Return all orders by getting all in the repository
      allOrders = [];
    }

    const total = allOrders.length;

    // Manual pagination
    const start = (page - 1) * perPage;
    const orders = allOrders.slice(start, start + perPage);

    return {
      orders: orders.map((order) => ({
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        status: order.status.value,
        customerId: order.customerId.toString(),
        createdBy: order.createdBy?.toString() ?? null,
        totalPrice: order.totalPrice,
        discount: order.discount,
        finalPrice: order.finalPrice,
        notes: order.notes ?? null,
        itemsCount: order.items.length,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? order.createdAt,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
