/**
 * ENUMS
 */

import { z } from 'zod';

export const salesOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

// Enum específico para criação de pedidos (apenas status iniciais válidos)
export const createSalesOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'CONFIRMED',
]);

export const paymentMethodEnum = z.enum([
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'BOLETO',
  'CASH',
  'TRANSFER',
]);

export const paymentStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
]);

export const deliveryMethodEnum = z.enum(['PICKUP', 'DELIVERY', 'SHIPPING']);
