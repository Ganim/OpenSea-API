import { SupportTicketAttachment } from '@/entities/core/support-ticket-attachment';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SupportTicketAttachment as PrismaSupportTicketAttachment } from '@prisma/generated/client';

export interface SupportTicketAttachmentDTO {
  id: string;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export function supportTicketAttachmentPrismaToDomain(
  raw: PrismaSupportTicketAttachment,
): SupportTicketAttachment {
  return SupportTicketAttachment.create(
    {
      id: new UniqueEntityID(raw.id),
      ticketId: raw.ticketId,
      fileName: raw.fileName,
      fileUrl: raw.fileUrl,
      fileSize: raw.fileSize,
      mimeType: raw.mimeType,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function supportTicketAttachmentToDTO(
  attachment: SupportTicketAttachment,
): SupportTicketAttachmentDTO {
  return {
    id: attachment.supportTicketAttachmentId.toString(),
    ticketId: attachment.ticketId,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    createdAt: attachment.createdAt,
  };
}

export function supportTicketAttachmentToPrisma(
  attachment: SupportTicketAttachment,
) {
  return {
    id: attachment.supportTicketAttachmentId.toString(),
    ticketId: attachment.ticketId,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
  };
}
