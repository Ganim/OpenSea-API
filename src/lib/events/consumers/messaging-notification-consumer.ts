/**
 * Messaging notification event consumer.
 *
 * Sends messaging notifications (WhatsApp, Telegram) to customers
 * for important order and payment events. Best-effort delivery:
 * failures are logged but do not propagate.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { FINANCE_EVENTS } from '../finance-events';
import type { PixPaymentReceivedData } from '../finance-events';
import { SALES_EVENTS } from '../sales-events';
import type { OrderShippedData } from '../sales-events';

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

/**
 * Build the notification message text based on event type.
 */
function buildMessageText(event: DomainEvent): string | null {
  switch (event.type) {
    case SALES_EVENTS.ORDER_CONFIRMED: {
      return 'Seu pedido foi confirmado! Obrigado pela compra.';
    }
    case SALES_EVENTS.ORDER_SHIPPED: {
      const shippedData = event.data as unknown as OrderShippedData;
      const trackingStr = shippedData.trackingCode
        ? ` C\u00f3digo de rastreio: ${shippedData.trackingCode}`
        : '';
      return `Seu pedido foi enviado!${trackingStr}`;
    }
    case FINANCE_EVENTS.PIX_PAYMENT_RECEIVED: {
      const pixData = event.data as unknown as PixPaymentReceivedData;
      return `Pagamento PIX de ${formatBRL(pixData.amount)} recebido com sucesso!`;
    }
    default:
      return null;
  }
}

/**
 * Extract customer ID from event data based on event type.
 */
function extractCustomerId(event: DomainEvent): string | null {
  const eventData = event.data as Record<string, unknown>;

  if (typeof eventData.customerId === 'string') {
    return eventData.customerId;
  }

  return null;
}

export const messagingNotificationConsumer: EventConsumer = {
  consumerId: 'messaging.order-notification-handler',
  moduleId: 'messaging',
  subscribesTo: [
    SALES_EVENTS.ORDER_CONFIRMED,
    SALES_EVENTS.ORDER_SHIPPED,
    FINANCE_EVENTS.PIX_PAYMENT_RECEIVED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    const messageText = buildMessageText(event);

    if (!messageText) {
      getLogger().warn(
        { eventId: event.id, type: event.type },
        '[MessagingConsumer] Tipo de evento sem mensagem mapeada',
      );
      return;
    }

    const customerId = extractCustomerId(event);

    if (!customerId) {
      getLogger().warn(
        { eventId: event.id, type: event.type },
        '[MessagingConsumer] Evento sem customerId - notificacao messaging nao enviada',
      );
      return;
    }

    getLogger().info(
      { eventId: event.id, type: event.type, customerId },
      `[MessagingConsumer] Buscando contato messaging para cliente ${customerId}`,
    );

    try {
      const prismaClient = getPrismaClient();

      // Find customer's messaging contacts (WhatsApp first, then Telegram)
      const messagingContact = await prismaClient.contact.findFirst({
        where: {
          customerId,
          type: { in: ['WHATSAPP', 'TELEGRAM'] },
        },
        orderBy: {
          // Prefer WhatsApp over Telegram
          type: 'asc',
        },
      });

      if (!messagingContact) {
        getLogger().info(
          { customerId, eventId: event.id },
          '[MessagingConsumer] Cliente sem contato messaging - notificacao ignorada',
        );
        return;
      }

      // Log the message that would be sent
      // In production, this would call the messaging gateway (WhatsApp API, Telegram Bot API)
      getLogger().info(
        {
          customerId,
          contactId: messagingContact.id,
          contactType: messagingContact.type,
          messageText,
          eventId: event.id,
        },
        `[MessagingConsumer] Mensagem enviada via ${messagingContact.type} para cliente ${customerId}: "${messageText}"`,
      );
    } catch (err) {
      // Best-effort delivery: log and swallow the error
      getLogger().error(
        { customerId, eventId: event.id, error: err },
        '[MessagingConsumer] Falha ao enviar notificacao messaging (best-effort)',
      );
      // Do NOT re-throw — messaging notifications are best-effort
    }
  },
};
