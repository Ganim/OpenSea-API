import { prisma } from '@/lib/prisma';
import type {
  CardAttachmentRecord,
  CardAttachmentsRepository,
  CreateCardAttachmentSchema,
} from '../card-attachments-repository';

const fileInclude = {
  file: {
    select: { name: true, mimeType: true, size: true },
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardAttachmentRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    fileId: raw.fileId,
    addedBy: raw.addedBy,
    createdAt: raw.createdAt,
    fileName: raw.file?.name ?? null,
    fileMimeType: raw.file?.mimeType ?? null,
    fileSizeBytes: raw.file?.size ?? null,
  };
}

export class PrismaCardAttachmentsRepository
  implements CardAttachmentsRepository
{
  async create(
    data: CreateCardAttachmentSchema,
  ): Promise<CardAttachmentRecord> {
    const raw = await prisma.cardAttachment.create({
      data: {
        cardId: data.cardId,
        fileId: data.fileId,
        addedBy: data.addedBy,
      },
      include: fileInclude,
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    cardId: string,
  ): Promise<CardAttachmentRecord | null> {
    const raw = await prisma.cardAttachment.findFirst({
      where: { id, cardId },
      include: fileInclude,
    });

    return raw ? toRecord(raw) : null;
  }

  async findByCardId(cardId: string): Promise<CardAttachmentRecord[]> {
    const rows = await prisma.cardAttachment.findMany({
      where: { cardId },
      include: fileInclude,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toRecord);
  }

  async delete(id: string, _cardId: string): Promise<void> {
    await prisma.cardAttachment.delete({
      where: { id },
    });
  }
}
