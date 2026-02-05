import type { ItemMovement } from '@/entities/stock/item-movement';

export interface ItemMovementDTO {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  movementType: string;
  reasonCode?: string;
  originRef?: string;
  destinationRef?: string;
  batchNumber?: string;
  notes?: string;
  approvedBy?: string;
  salesOrderId?: string;
  createdAt: Date;
}

export function itemMovementToDTO(movement: ItemMovement): ItemMovementDTO {
  return {
    id: movement.id.toString(),
    itemId: movement.itemId.toString(),
    userId: movement.userId.toString(),
    quantity: movement.quantity,
    quantityBefore: movement.quantityBefore,
    quantityAfter: movement.quantityAfter,
    movementType: movement.movementType.value,
    reasonCode: movement.reasonCode,
    originRef: movement.originRef,
    destinationRef: movement.destinationRef,
    batchNumber: movement.batchNumber,
    notes: movement.notes,
    approvedBy: movement.approvedBy?.toString(),
    salesOrderId: movement.salesOrderId?.toString(),
    createdAt: movement.createdAt,
  };
}
