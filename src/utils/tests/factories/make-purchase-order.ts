import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { PurchaseOrder } from '@/entities/stock/purchase-order';
import { faker } from '@faker-js/faker';

export function makePurchaseOrder(
  override?: Partial<{
    orderNumber: string;
    supplierId: UniqueEntityID;
    createdBy: UniqueEntityID;
    status: string;
    expectedDate: Date;
    notes: string;
  }>,
) {
  const status =
    typeof override?.status === 'string'
      ? OrderStatus.create(override.status)
      : OrderStatus.create('PENDING');

  return PurchaseOrder.create({
    orderNumber:
      override?.orderNumber ?? faker.string.alphanumeric(10).toUpperCase(),
    supplierId: override?.supplierId ?? new UniqueEntityID(),
    createdBy: override?.createdBy ?? new UniqueEntityID(),
    status,
    expectedDate: override?.expectedDate ?? faker.date.future(),
    notes: override?.notes ?? faker.lorem.sentence(),
    items: [],
  });
}
