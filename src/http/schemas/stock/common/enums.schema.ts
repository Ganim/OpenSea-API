/**
 * ENUMS
 */

import { z } from 'zod';

export const itemStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'IN_TRANSIT',
  'DAMAGED',
  'EXPIRED',
  'DISPOSED',
]);
export const movementTypeEnum = z.enum([
  'PURCHASE',
  'CUSTOMER_RETURN',
  'SALE',
  'PRODUCTION',
  'SAMPLE',
  'LOSS',
  'SUPPLIER_RETURN',
  'TRANSFER',
  'INVENTORY_ADJUSTMENT',
  'ZONE_RECONFIGURE',
]);
export const purchaseOrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'RECEIVED',
  'CANCELLED',
]);
