/**
 * ENUMS
 */

import { z } from 'zod';

export const itemStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'DAMAGED',
]);
export const movementTypeEnum = z.enum([
  'ENTRY',
  'EXIT',
  'TRANSFER',
  'ADJUSTMENT',
]);
export const purchaseOrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'RECEIVED',
  'CANCELLED',
]);
