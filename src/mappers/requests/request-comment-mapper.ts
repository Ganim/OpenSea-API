import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestComment } from '@/entities/requests/request-comment';
import type {
  Prisma,
  RequestComment as PrismaRequestComment,
} from '@prisma/generated/client.js';

export class RequestCommentMapper {
  static toDomain(raw: PrismaRequestComment): RequestComment {
    return RequestComment.create(
      {
        requestId: new UniqueEntityID(raw.requestId),
        authorId: new UniqueEntityID(raw.authorId),
        content: raw.content,
        isInternal: raw.isInternal,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt ?? undefined,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    comment: RequestComment,
  ): Prisma.RequestCommentUncheckedCreateInput {
    return {
      id: comment.id.toString(),
      requestId: comment.requestId.toString(),
      authorId: comment.authorId.toString(),
      content: comment.content,
      isInternal: comment.isInternal,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
    };
  }
}
