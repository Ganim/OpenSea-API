import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { CustomersRepository } from '@/repositories/sales/customers-repository';
import { SalesOrdersRepository } from '@/repositories/sales/sales-orders-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

interface CreateSalesOrderItem {
  variantId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  notes?: string;
}

interface CreateSalesOrderUseCaseRequest {
  orderNumber: string;
  customerId: string;
  createdBy?: string;
  status?: 'DRAFT' | 'PENDING' | 'CONFIRMED';
  discount?: number;
  notes?: string;
  items: CreateSalesOrderItem[];
}

interface CreateSalesOrderUseCaseResponse {
  salesOrder: {
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

export class CreateSalesOrderUseCase {
  constructor(
    private salesOrdersRepository: SalesOrdersRepository,
    private customersRepository: CustomersRepository,
    private variantsRepository: VariantsRepository,
  ) {}

  async execute(
    input: CreateSalesOrderUseCaseRequest,
  ): Promise<CreateSalesOrderUseCaseResponse> {
    // Validate orderNumber
    if (!input.orderNumber || input.orderNumber.trim().length === 0) {
      throw new BadRequestError('Order number is required.');
    }

    if (input.orderNumber.length > 50) {
      throw new BadRequestError('Order number cannot exceed 50 characters.');
    }

    // Check if orderNumber already exists
    const existingOrder = await this.salesOrdersRepository.findByOrderNumber(
      input.orderNumber,
    );
    if (existingOrder) {
      throw new BadRequestError('Order number already exists.');
    }

    // Validate customer exists
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.customerId),
    );
    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    // Validate items
    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Order must have at least one item.');
    }

    if (input.items.length > 100) {
      throw new BadRequestError('Order cannot have more than 100 items.');
    }

    // Validate each item and check if variants exist
    for (const item of input.items) {
      if (!item.variantId) {
        throw new BadRequestError('Item variant ID is required.');
      }

      const variant = await this.variantsRepository.findById(
        new UniqueEntityID(item.variantId),
      );
      if (!variant) {
        throw new ResourceNotFoundError(
          `Variant with ID ${item.variantId} not found.`,
        );
      }

      if (item.quantity <= 0) {
        throw new BadRequestError('Item quantity must be greater than zero.');
      }

      if (item.quantity > 10000) {
        throw new BadRequestError('Item quantity cannot exceed 10,000.');
      }

      if (item.unitPrice < 0) {
        throw new BadRequestError('Item unit price cannot be negative.');
      }

      if (item.discount && item.discount < 0) {
        throw new BadRequestError('Item discount cannot be negative.');
      }

      if (item.notes && item.notes.length > 500) {
        throw new BadRequestError('Item notes cannot exceed 500 characters.');
      }
    }

    // Validate discount
    if (input.discount && input.discount < 0) {
      throw new BadRequestError('Order discount cannot be negative.');
    }

    // Validate notes
    if (input.notes && input.notes.length > 1000) {
      throw new BadRequestError('Order notes cannot exceed 1000 characters.');
    }

    // Create order
    const order = await this.salesOrdersRepository.create({
      orderNumber: input.orderNumber.trim(),
      customerId: new UniqueEntityID(input.customerId),
      createdBy: input.createdBy
        ? new UniqueEntityID(input.createdBy)
        : undefined,
      status: input.status
        ? OrderStatus.create(input.status)
        : OrderStatus.PENDING(),
      discount: input.discount ?? 0,
      notes: input.notes,
      items: input.items.map((item) => ({
        variantId: new UniqueEntityID(item.variantId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount ?? 0,
        notes: item.notes,
      })),
    });

    return {
      salesOrder: {
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
