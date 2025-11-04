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
  salesOrders: Array<{
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
    deletedAt: Date | null;
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
      // Return all orders without filters
      allOrders = await this.salesOrdersRepository.findMany(1, 999999);
    }

    const total = allOrders.length;

    // Manual pagination
    const start = (page - 1) * perPage;
    const orders = allOrders.slice(start, start + perPage);

    return {
      salesOrders: orders.map((order) => ({
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
        deletedAt: order.deletedAt ?? null,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
