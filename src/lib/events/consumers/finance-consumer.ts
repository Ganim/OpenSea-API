/**
 * Finance module event consumer.
 *
 * Creates finance entries (RECEIVABLE) when orders are paid,
 * and links PIX payments to orders when PIX is received.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { FINANCE_EVENTS } from '../finance-events';
import type { PixPaymentReceivedData } from '../finance-events';
import { SALES_EVENTS } from '../sales-events';
import type { OrderPaidData } from '../sales-events';

// Lazy logger to avoid @env initialization in unit tests
let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

/**
 * Lazily load Prisma client for direct database access.
 * Uses prisma directly (not use cases) to avoid circular dependencies.
 */
function getPrismaClient() {
  const { prisma } = require('@/lib/prisma'); // eslint-disable-line @typescript-eslint/no-require-imports
  return prisma;
}

/**
 * Format a currency value as BRL string.
 */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const financeOrderPaymentConsumer: EventConsumer = {
  consumerId: 'finance.order-payment-handler',
  moduleId: 'finance',
  subscribesTo: [SALES_EVENTS.ORDER_PAID],

  async handle(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as OrderPaidData;
    const { orderId, total, paymentMethod, items } = data;

    getLogger().info(
      { orderId, total, paymentMethod, eventId: event.id },
      `[FinanceConsumer] Criando entrada financeira para pedido pago #${orderId.slice(0, 8)}`,
    );

    try {
      const prismaClient = getPrismaClient();

      // Find or create the "Vendas" category for this tenant
      let salesCategory = await prismaClient.financeCategory.findFirst({
        where: {
          tenantId: event.tenantId,
          name: 'Vendas',
        },
      });

      if (!salesCategory) {
        salesCategory = await prismaClient.financeCategory.create({
          data: {
            tenantId: event.tenantId,
            name: 'Vendas',
            type: 'RECEIVABLE',
            color: '#10B981', // emerald-500
          },
        });
      }

      // Generate a sequential code for the entry
      const entryCount = await prismaClient.financeEntry.count({
        where: { tenantId: event.tenantId },
      });
      const entryCode = `REC-${String(entryCount + 1).padStart(6, '0')}`;

      const itemCount = items?.length ?? 0;
      const description = `Pedido #${orderId.slice(0, 8)} \u2014 ${itemCount} item(ns)`;

      await prismaClient.financeEntry.create({
        data: {
          tenantId: event.tenantId,
          type: 'RECEIVABLE',
          code: entryCode,
          description,
          categoryId: salesCategory.id,
          expectedAmount: total,
          actualAmount: total,
          issueDate: new Date(),
          dueDate: new Date(),
          paymentDate: new Date(),
          status: 'PAID',
          metadata: {
            orderId,
            paymentMethod,
            sourceEventId: event.id,
          },
        },
      });

      getLogger().info(
        { orderId, entryCode, total: formatBRL(total), eventId: event.id },
        `[FinanceConsumer] Entrada financeira ${entryCode} criada para pedido #${orderId.slice(0, 8)}`,
      );
    } catch (err) {
      getLogger().error(
        { orderId, eventId: event.id, error: err },
        '[FinanceConsumer] Falha ao criar entrada financeira para pedido pago',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};

export const financePixPaymentConsumer: EventConsumer = {
  consumerId: 'finance.pix-payment-handler',
  moduleId: 'finance',
  subscribesTo: [FINANCE_EVENTS.PIX_PAYMENT_RECEIVED],

  async handle(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as PixPaymentReceivedData;
    const { pixChargeId, txId, amount, payerName, orderId } = data;

    getLogger().info(
      { pixChargeId, txId, amount, orderId, eventId: event.id },
      `[FinanceConsumer] Processando pagamento PIX recebido txId=${txId}`,
    );

    try {
      const prismaClient = getPrismaClient();

      // Find or create the "Vendas" category for this tenant
      let salesCategory = await prismaClient.financeCategory.findFirst({
        where: {
          tenantId: event.tenantId,
          name: 'Vendas',
        },
      });

      if (!salesCategory) {
        salesCategory = await prismaClient.financeCategory.create({
          data: {
            tenantId: event.tenantId,
            name: 'Vendas',
            type: 'RECEIVABLE',
            color: '#10B981',
          },
        });
      }

      // Generate a sequential code for the entry
      const entryCount = await prismaClient.financeEntry.count({
        where: { tenantId: event.tenantId },
      });
      const entryCode = `PIX-${String(entryCount + 1).padStart(6, '0')}`;

      const payerStr = payerName ? ` de ${payerName}` : '';
      const description = `Pagamento PIX${payerStr} \u2014 txId ${txId.slice(0, 12)}`;

      await prismaClient.financeEntry.create({
        data: {
          tenantId: event.tenantId,
          type: 'RECEIVABLE',
          code: entryCode,
          description,
          categoryId: salesCategory.id,
          expectedAmount: amount,
          actualAmount: amount,
          issueDate: new Date(),
          dueDate: new Date(),
          paymentDate: new Date(),
          status: 'PAID',
          salesOrderId: orderId ?? undefined,
          metadata: {
            pixChargeId,
            txId,
            payerName: payerName ?? null,
            sourceEventId: event.id,
          },
        },
      });

      getLogger().info(
        { txId, entryCode, amount: formatBRL(amount), eventId: event.id },
        `[FinanceConsumer] Entrada financeira ${entryCode} criada para PIX txId=${txId}`,
      );
    } catch (err) {
      getLogger().error(
        { txId, pixChargeId, eventId: event.id, error: err },
        '[FinanceConsumer] Falha ao processar pagamento PIX recebido',
      );
      throw err; // Re-throw to trigger retry
    }
  },
};
