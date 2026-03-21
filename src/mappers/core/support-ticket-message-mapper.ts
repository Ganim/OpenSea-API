import {
  SupportTicketMessage,
  type TicketAuthorType,
} from '@/entities/core/support-ticket-message';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SupportTicketMessage as PrismaSupportTicketMessage } from '@prisma/generated/client';

export interface SupportTicketMessageDTO {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorType: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
}

export function supportTicketMessagePrismaToDomain(
  raw: PrismaSupportTicketMessage,
): SupportTicketMessage {
  return SupportTicketMessage.create(
    {
      id: new UniqueEntityID(raw.id),
      ticketId: raw.ticketId,
      authorId: raw.authorId,
      authorType: raw.authorType as TicketAuthorType,
      body: raw.body,
      isInternal: raw.isInternal,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function supportTicketMessageToDTO(
  message: SupportTicketMessage,
): SupportTicketMessageDTO {
  return {
    id: message.supportTicketMessageId.toString(),
    ticketId: message.ticketId,
    authorId: message.authorId,
    authorType: message.authorType,
    body: message.body,
    isInternal: message.isInternal,
    createdAt: message.createdAt,
  };
}

export function supportTicketMessageToPrisma(message: SupportTicketMessage) {
  return {
    id: message.supportTicketMessageId.toString(),
    ticketId: message.ticketId,
    authorId: message.authorId,
    authorType: message.authorType as PrismaSupportTicketMessage['authorType'],
    body: message.body,
    isInternal: message.isInternal,
  };
}
