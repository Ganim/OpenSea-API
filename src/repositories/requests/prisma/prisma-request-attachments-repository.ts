import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestAttachment } from '@/entities/requests/request-attachment';
import { prisma } from '@/lib/prisma';
import { RequestAttachmentMapper } from '@/mappers/requests/request-attachment-mapper';
import type { RequestAttachmentsRepository } from '../request-attachments-repository';

export class PrismaRequestAttachmentsRepository
  implements RequestAttachmentsRepository
{
  async create(attachment: RequestAttachment): Promise<void> {
    const data = RequestAttachmentMapper.toPrisma(attachment);
    await prisma.requestAttachment.create({ data });
  }

  async findById(id: UniqueEntityID): Promise<RequestAttachment | null> {
    const attachment = await prisma.requestAttachment.findUnique({
      where: { id: id.toString() },
    });

    if (!attachment) {
      return null;
    }

    return RequestAttachmentMapper.toDomain(attachment);
  }

  async findManyByRequestId(
    requestId: UniqueEntityID,
  ): Promise<RequestAttachment[]> {
    const attachments = await prisma.requestAttachment.findMany({
      where: { requestId: requestId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return attachments.map(RequestAttachmentMapper.toDomain);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.requestAttachment.delete({
      where: { id: id.toString() },
    });
  }
}
