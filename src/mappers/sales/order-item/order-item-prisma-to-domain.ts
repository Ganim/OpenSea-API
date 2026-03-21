import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderItem } from '@/entities/sales/order-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function orderItemPrismaToDomain(raw: any): OrderItem {
  return OrderItem.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      orderId: new UniqueEntityID(raw.orderId),
      variantId: raw.variantId ? new UniqueEntityID(raw.variantId) : undefined,
      comboId: raw.comboId ? new UniqueEntityID(raw.comboId) : undefined,
      name: raw.name,
      sku: raw.sku ?? undefined,
      description: raw.description ?? undefined,
      quantity: Number(raw.quantity),
      unitPrice: Number(raw.unitPrice),
      discountPercent: Number(raw.discountPercent ?? 0),
      discountValue: Number(raw.discountValue ?? 0),
      subtotal: Number(raw.subtotal),
      taxIcms: Number(raw.taxIcms ?? 0),
      taxIpi: Number(raw.taxIpi ?? 0),
      taxPis: Number(raw.taxPis ?? 0),
      taxCofins: Number(raw.taxCofins ?? 0),
      taxTotal: Number(raw.taxTotal ?? 0),
      ncm: raw.ncm ?? undefined,
      cfop: raw.cfop ?? undefined,
      quantityDelivered: Number(raw.quantityDelivered ?? 0),
      quantityReturned: Number(raw.quantityReturned ?? 0),
      priceSource: raw.priceSource ?? 'DEFAULT',
      priceSourceId: raw.priceSourceId ?? undefined,
      position: raw.position ?? 0,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
