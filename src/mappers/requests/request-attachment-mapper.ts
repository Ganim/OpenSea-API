import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestAttachment } from '@/entities/requests/request-attachment';
import type {
  Prisma,
  RequestAttachment as PrismaRequestAttachment,
} from '@prisma/generated/client.js';

export class RequestAttachmentMapper {
  static toDomain(raw: PrismaRequestAttachment): RequestAttachment {
    return RequestAttachment.create(
      {
        requestId: new UniqueEntityID(raw.requestId),
        fileName: raw.fileName,
        filePath: raw.filePath,
        fileSize: raw.fileSize,
        mimeType: raw.mimeType,
        uploadedById: new UniqueEntityID(raw.uploadedById),
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    attachment: RequestAttachment,
  ): Prisma.RequestAttachmentUncheckedCreateInput {
    return {
      id: attachment.id.toString(),
      requestId: attachment.requestId.toString(),
      fileName: attachment.fileName,
      filePath: attachment.filePath,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      uploadedById: attachment.uploadedById.toString(),
      createdAt: attachment.createdAt,
    };
  }
}
