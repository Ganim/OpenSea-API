import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestComment } from '@/entities/requests/request-comment';
import { prisma } from '@/lib/prisma';
import { RequestCommentMapper } from '@/mappers/requests/request-comment-mapper';
import type { RequestCommentsRepository } from '../request-comments-repository';

export class PrismaRequestCommentsRepository
  implements RequestCommentsRepository
{
  async create(comment: RequestComment): Promise<void> {
    const data = RequestCommentMapper.toPrisma(comment);
    await prisma.requestComment.create({ data });
  }

  async save(comment: RequestComment): Promise<void> {
    const data = RequestCommentMapper.toPrisma(comment);
    await prisma.requestComment.update({
      where: { id: comment.id.toString() },
      data,
    });
  }

  async findById(id: UniqueEntityID): Promise<RequestComment | null> {
    const comment = await prisma.requestComment.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!comment) {
      return null;
    }

    return RequestCommentMapper.toDomain(comment);
  }

  async findManyByRequestId(
    requestId: UniqueEntityID,
  ): Promise<RequestComment[]> {
    const comments = await prisma.requestComment.findMany({
      where: {
        requestId: requestId.toString(),
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map(RequestCommentMapper.toDomain);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.requestComment.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
