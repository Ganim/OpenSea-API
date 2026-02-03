import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';

interface CreatePurchaseOrderUseCaseRequest {
  tenantId: string;
  orderNumber: string;
  supplierId: string;
  createdBy?: string;
  status?: string;
  expectedDate?: Date;
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitCost: number;
    notes?: string;
  }>;
}

interface CreatePurchaseOrderUseCaseResponse {
  purchaseOrder: PurchaseOrderDTO;
}

export class CreatePurchaseOrderUseCase {
  constructor(
    private purchaseOrdersRepository: PurchaseOrdersRepository,
    private suppliersRepository: SuppliersRepository,
    private variantsRepository: VariantsRepository,
  ) {}

  async execute(
    request: CreatePurchaseOrderUseCaseRequest,
  ): Promise<CreatePurchaseOrderUseCaseResponse> {
    const {
      tenantId,
      orderNumber,
      supplierId,
      createdBy,
      status,
      expectedDate,
      notes,
      items,
    } = request;

    // Validate order number
    if (!orderNumber || orderNumber.trim().length === 0) {
      throw new BadRequestError('Order number is required');
    }

    if (orderNumber.length > 50) {
      throw new BadRequestError(
        'Order number must be at most 50 characters long',
      );
    }

    // Check if order number already exists
    const existingOrder = await this.purchaseOrdersRepository.findByOrderNumber(
      orderNumber,
      tenantId,
    );
    if (existingOrder) {
      throw new BadRequestError('Order number already exists');
    }

    // Validate supplier
    if (!supplierId) {
      throw new BadRequestError('Supplier ID is required');
    }

    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(supplierId),
      tenantId,
    );
    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    // Validate items
    if (!items || items.length === 0) {
      throw new BadRequestError('At least one item is required');
    }

    // Validate each item
    for (const item of items) {
      if (!item.variantId) {
        throw new BadRequestError('Variant ID is required for all items');
      }

      const variant = await this.variantsRepository.findById(
        new UniqueEntityID(item.variantId),
        tenantId,
      );
      if (!variant) {
        throw new ResourceNotFoundError(
          `Variant with ID ${item.variantId} not found`,
        );
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestError('Item quantity must be greater than 0');
      }

      if (item.unitCost === undefined || item.unitCost < 0) {
        throw new BadRequestError(
          'Item unit cost is required and must be greater than or equal to 0',
        );
      }
    }

    // Create the purchase order
    const orderStatus = status
      ? OrderStatus.create(status)
      : OrderStatus.create('PENDING');

    const purchaseOrder = await this.purchaseOrdersRepository.create({
      tenantId,
      orderNumber,
      supplierId: new UniqueEntityID(supplierId),
      createdBy: createdBy ? new UniqueEntityID(createdBy) : undefined,
      status: orderStatus,
      expectedDate,
      notes,
      items: items.map((item) => ({
        variantId: new UniqueEntityID(item.variantId),
        quantity: item.quantity,
        unitCost: item.unitCost,
        notes: item.notes,
      })),
    });

    return { purchaseOrder: purchaseOrderToDTO(purchaseOrder) };
  }
}
