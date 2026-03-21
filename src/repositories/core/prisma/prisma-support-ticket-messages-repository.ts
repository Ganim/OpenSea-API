import type { SupportTicketMessage } from '@/entities/core/support-ticket-message';
import { prisma } from '@/lib/prisma';
import {
  supportTicketMessagePrismaToDomain,
  supportTicketMessageToPrisma,
} from '@/mappers/core/support-ticket-message-mapper';
import type { Prisma } from '@prisma/generated/client';
import type { SupportTicketMessagesRepository } from '../support-ticket-messages-repository';

export class PrismaSupportTicketMessagesRepository
  implements SupportTicketMessagesRepository
{
  async findByTicketId(ticketId: string): Promise<SupportTicketMessage[]> {
    const messagesDb = await prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    return messagesDb.map(supportTicketMessagePrismaToDomain);
  }

  async create(message: SupportTicketMessage): Promise<void> {
    const prismaData = supportTicketMessageToPrisma(message);

    await prisma.supportTicketMessage.create({
      data: prismaData as Prisma.SupportTicketMessageUncheckedCreateInput,
    });
  }
}
