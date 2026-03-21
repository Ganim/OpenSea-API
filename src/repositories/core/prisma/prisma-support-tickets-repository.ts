import type { SupportTicket } from '@/entities/core/support-ticket';
import { prisma } from '@/lib/prisma';
import {
  supportTicketPrismaToDomain,
  supportTicketToPrisma,
} from '@/mappers/core/support-ticket-mapper';
import type { Prisma } from '@prisma/generated/client';
import type {
  SupportTicketFilters,
  SupportTicketsRepository,
} from '../support-tickets-repository';

export class PrismaSupportTicketsRepository
  implements SupportTicketsRepository
{
  async findById(ticketId: string): Promise<SupportTicket | null> {
    const ticketDb = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticketDb) return null;
    return supportTicketPrismaToDomain(ticketDb);
  }

  async findMany(
    page: number,
    perPage: number,
    filters?: SupportTicketFilters,
  ): Promise<SupportTicket[]> {
    const where = this.buildWhereClause(filters);

    const ticketsDb = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return ticketsDb.map(supportTicketPrismaToDomain);
  }

  async countAll(filters?: SupportTicketFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return prisma.supportTicket.count({ where });
  }

  async create(ticket: SupportTicket): Promise<SupportTicket> {
    const prismaData = supportTicketToPrisma(ticket);

    const createdTicket = await prisma.supportTicket.create({
      data: prismaData as Prisma.SupportTicketUncheckedCreateInput,
    });

    return supportTicketPrismaToDomain(createdTicket);
  }

  async save(ticket: SupportTicket): Promise<void> {
    const prismaData = supportTicketToPrisma(ticket);

    await prisma.supportTicket.update({
      where: { id: prismaData.id },
      data: prismaData as Prisma.SupportTicketUncheckedUpdateInput,
    });
  }

  private buildWhereClause(
    filters?: SupportTicketFilters,
  ): Prisma.SupportTicketWhereInput {
    if (!filters) return {};

    const where: Prisma.SupportTicketWhereInput = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.status) where.status = filters.status as never;
    if (filters.priority) where.priority = filters.priority as never;
    if (filters.category) where.category = filters.category as never;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    return where;
  }
}
