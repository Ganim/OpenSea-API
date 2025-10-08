import type { SalesOrder, SalesOrderItem } from '@/entities/sales/sales-order';

export interface SalesOrderItemDTO {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SalesOrderDTO {
  id: string;
  orderNumber: string;
  customerId: string;
  createdBy?: string;
  status: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  notes?: string;
  items: SalesOrderItemDTO[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function salesOrderItemToDTO(item: SalesOrderItem): SalesOrderItemDTO {
  return {
    id: item.id.toString(),
    orderId: item.orderId.toString(),
    variantId: item.variantId.toString(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    totalPrice: item.totalPrice,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function salesOrderToDTO(order: SalesOrder): SalesOrderDTO {
  return {
    id: order.id.toString(),
    orderNumber: order.orderNumber,
    customerId: order.customerId.toString(),
    createdBy: order.createdBy?.toString(),
    status: order.status.value,
    totalPrice: order.totalPrice,
    discount: order.discount,
    finalPrice: order.finalPrice,
    notes: order.notes,
    items: order.items.map(salesOrderItemToDTO),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deletedAt: order.deletedAt,
  };
}
