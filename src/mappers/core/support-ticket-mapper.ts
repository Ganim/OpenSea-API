import {
  SupportTicket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '@/entities/core/support-ticket';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SupportTicket as PrismaSupportTicket } from '@prisma/generated/client';

export interface SupportTicketDTO {
  id: string;
  ticketNumber: number;
  tenantId: string;
  creatorId: string;
  assigneeId: string | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function supportTicketPrismaToDomain(
  raw: PrismaSupportTicket,
): SupportTicket {
  return SupportTicket.create(
    {
      id: new UniqueEntityID(raw.id),
      ticketNumber: raw.ticketNumber,
      tenantId: raw.tenantId,
      creatorId: raw.creatorId,
      assigneeId: raw.assigneeId,
      title: raw.title,
      category: raw.category as TicketCategory,
      priority: raw.priority as TicketPriority,
      status: raw.status as TicketStatus,
      resolvedAt: raw.resolvedAt,
      closedAt: raw.closedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function supportTicketToDTO(ticket: SupportTicket): SupportTicketDTO {
  return {
    id: ticket.supportTicketId.toString(),
    ticketNumber: ticket.ticketNumber,
    tenantId: ticket.tenantId,
    creatorId: ticket.creatorId,
    assigneeId: ticket.assigneeId,
    title: ticket.title,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export function supportTicketToPrisma(ticket: SupportTicket) {
  return {
    id: ticket.supportTicketId.toString(),
    tenantId: ticket.tenantId,
    creatorId: ticket.creatorId,
    assigneeId: ticket.assigneeId,
    title: ticket.title,
    category: ticket.category as PrismaSupportTicket['category'],
    priority: ticket.priority as PrismaSupportTicket['priority'],
    status: ticket.status as PrismaSupportTicket['status'],
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
  };
}
