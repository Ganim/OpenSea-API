import type { SupportTicketAttachment } from '@/entities/core/support-ticket-attachment';
import { prisma } from '@/lib/prisma';
import {
  supportTicketAttachmentPrismaToDomain,
  supportTicketAttachmentToPrisma,
} from '@/mappers/core/support-ticket-attachment-mapper';
import type { Prisma } from '@prisma/generated/client';
import type { SupportTicketAttachmentsRepository } from '../support-ticket-attachments-repository';

export class PrismaSupportTicketAttachmentsRepository
  implements SupportTicketAttachmentsRepository
{
  async findByTicketId(ticketId: string): Promise<SupportTicketAttachment[]> {
    const attachmentsDb = await prisma.supportTicketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    return attachmentsDb.map(supportTicketAttachmentPrismaToDomain);
  }

  async create(attachment: SupportTicketAttachment): Promise<void> {
    const prismaData = supportTicketAttachmentToPrisma(attachment);

    await prisma.supportTicketAttachment.create({
      data: prismaData as Prisma.SupportTicketAttachmentUncheckedCreateInput,
    });
  }
}
