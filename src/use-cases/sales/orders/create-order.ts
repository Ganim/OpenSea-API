import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Order,
  type OrderChannel,
  type OrderType,
} from '@/entities/sales/order';
import { OrderItem } from '@/entities/sales/order-item';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface CreateOrderItem {
  variantId?: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountValue?: number;
  notes?: string;
}

interface CreateOrderUseCaseRequest {
  tenantId: string;
  type: OrderType;
  customerId: string;
  contactId?: string;
  pipelineId: string;
  stageId: string;
  channel: OrderChannel;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  currency?: string;
  priceTableId?: string;
  paymentConditionId?: string;
  deliveryMethod?: string;
  deliveryAddress?: Record<string, unknown>;
  sourceWarehouseId?: string;
  assignedToUserId?: string;
  dealId?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  expiresAt?: string;
  items: CreateOrderItem[];
}

interface CreateOrderUseCaseResponse {
  order: Order;
  items: OrderItem[];
}

export class CreateOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private customersRepository: CustomersRepository,
    private pipelinesRepository: PipelinesRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
  ) {}

  async execute(
    input: CreateOrderUseCaseRequest,
  ): Promise<CreateOrderUseCaseResponse> {
    // Validate customer exists
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.customerId),
      input.tenantId,
    );
    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    // Validate pipeline exists
    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(input.pipelineId),
      input.tenantId,
    );
    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found.');
    }

    // Validate stage exists and belongs to pipeline
    const stage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(input.stageId),
    );
    if (!stage) {
      throw new ResourceNotFoundError('Pipeline stage not found.');
    }
    if (stage.pipelineId.toString() !== input.pipelineId) {
      throw new BadRequestError(
        'Stage does not belong to the specified pipeline.',
      );
    }

    // Validate items
    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Order must have at least one item.');
    }

    // Generate order number
    const orderNumber = await this.ordersRepository.getNextOrderNumber(
      input.tenantId,
    );

    // Calculate totals from items
    let calculatedSubtotal = 0;
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError('Item quantity must be greater than zero.');
      }
      if (item.unitPrice < 0) {
        throw new BadRequestError('Item unit price cannot be negative.');
      }
      const discountValue = item.discountValue ?? 0;
      calculatedSubtotal += item.quantity * item.unitPrice - discountValue;
    }

    const order = Order.create({
      tenantId: new UniqueEntityID(input.tenantId),
      orderNumber,
      type: input.type,
      customerId: new UniqueEntityID(input.customerId),
      contactId: input.contactId
        ? new UniqueEntityID(input.contactId)
        : undefined,
      pipelineId: new UniqueEntityID(input.pipelineId),
      stageId: new UniqueEntityID(input.stageId),
      channel: input.channel,
      subtotal: input.subtotal ?? calculatedSubtotal,
      discountTotal: input.discountTotal,
      taxTotal: input.taxTotal,
      shippingTotal: input.shippingTotal,
      currency: input.currency,
      priceTableId: input.priceTableId
        ? new UniqueEntityID(input.priceTableId)
        : undefined,
      paymentConditionId: input.paymentConditionId
        ? new UniqueEntityID(input.paymentConditionId)
        : undefined,
      deliveryMethod: input.deliveryMethod as
        | 'PICKUP'
        | 'OWN_FLEET'
        | 'CARRIER'
        | 'PARTIAL'
        | undefined,
      deliveryAddress: input.deliveryAddress,
      sourceWarehouseId: input.sourceWarehouseId
        ? new UniqueEntityID(input.sourceWarehouseId)
        : undefined,
      assignedToUserId: input.assignedToUserId
        ? new UniqueEntityID(input.assignedToUserId)
        : undefined,
      dealId: input.dealId ? new UniqueEntityID(input.dealId) : undefined,
      notes: input.notes,
      internalNotes: input.internalNotes,
      tags: input.tags,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    await this.ordersRepository.create(order);

    // Create order items
    const orderItems: OrderItem[] = [];
    for (let i = 0; i < input.items.length; i++) {
      const itemData = input.items[i];
      const item = OrderItem.create({
        tenantId: new UniqueEntityID(input.tenantId),
        orderId: order.id,
        variantId: itemData.variantId
          ? new UniqueEntityID(itemData.variantId)
          : undefined,
        name: itemData.name,
        sku: itemData.sku,
        description: itemData.description,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        discountPercent: itemData.discountPercent,
        discountValue: itemData.discountValue,
        notes: itemData.notes,
        position: i,
      });
      orderItems.push(item);
    }

    await this.orderItemsRepository.createMany(orderItems);

    return { order, items: orderItems };
  }
}
