import {
  PurchaseOrder,
  PurchaseOrderItem,
} from '@/entities/stock/purchase-order';

export interface PurchaseOrderItemDTO {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface PurchaseOrderDTO {
  id: string;
  orderNumber: string;
  status: string;
  supplierId: string;
  createdBy: string | null;
  totalCost: number;
  expectedDate: Date | null;
  receivedDate: Date | null;
  notes: string | null;
  items: PurchaseOrderItemDTO[];
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

function purchaseOrderItemToDTO(item: PurchaseOrderItem): PurchaseOrderItemDTO {
  return {
    id: item.id.toString(),
    orderId: item.orderId.toString(),
    variantId: item.variantId.toString(),
    quantity: item.quantity,
    unitCost: item.unitCost,
    totalCost: item.totalCost,
    notes: item.notes ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? null,
  };
}

export function purchaseOrderToDTO(order: PurchaseOrder): PurchaseOrderDTO {
  return {
    id: order.id.toString(),
    orderNumber: order.orderNumber,
    status: order.status.value,
    supplierId: order.supplierId.toString(),
    createdBy: order.createdBy?.toString() ?? null,
    totalCost: order.totalCost,
    expectedDate: order.expectedDate ?? null,
    receivedDate: order.receivedDate ?? null,
    notes: order.notes ?? null,
    items: order.items.map(purchaseOrderItemToDTO),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? null,
    deletedAt: order.deletedAt ?? null,
  };
}
