import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CardCommentRecord,
  CardCommentsRepository,
  CreateCardCommentSchema,
  FindManyCardCommentsOptions,
  FindManyCardCommentsResult,
  UpdateCardCommentSchema,
} from '../card-comments-repository';

const authorInclude = {
  author: {
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { name: true, surname: true } },
    },
  },
} as const;

function resolveAuthorName(
  author: {
    username: string | null;
    profile?: { name: string; surname: string } | null;
  } | null,
): string | null {
  if (!author) return null;

  if (author.profile) {
    const fullName =
      `${author.profile.name ?? ''} ${author.profile.surname ?? ''}`.trim();
    return fullName || author.username || null;
  }

  return author.username || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardCommentRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    authorId: raw.authorId,
    content: raw.content,
    mentions: (raw.mentions as string[] | null) ?? null,
    editedAt: raw.editedAt,
    deletedAt: raw.deletedAt,
    createdAt: raw.createdAt,
    authorName: resolveAuthorName(raw.author ?? null),
    authorEmail: raw.author?.email ?? null,
  };
}

export class PrismaCardCommentsRepository implements CardCommentsRepository {
  async create(data: CreateCardCommentSchema): Promise<CardCommentRecord> {
    const raw = await prisma.cardComment.create({
      data: {
        cardId: data.cardId,
        authorId: data.authorId,
        content: data.content,
        mentions: (data.mentions as Prisma.InputJsonValue) ?? undefined,
      },
      include: authorInclude,
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    cardId: string,
  ): Promise<CardCommentRecord | null> {
    const raw = await prisma.cardComment.findFirst({
      where: { id, cardId },
      include: authorInclude,
    });

    return raw ? toRecord(raw) : null;
  }

  async findByCardId(
    options: FindManyCardCommentsOptions,
  ): Promise<FindManyCardCommentsResult> {
    const { cardId, includeDeleted, page = 1, limit = 20 } = options;

    const where: Prisma.CardCommentWhereInput = {
      cardId,
      ...(!includeDeleted && { deletedAt: null }),
    };

    const [comments, total] = await Promise.all([
      prisma.cardComment.findMany({
        where,
        include: authorInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cardComment.count({ where }),
    ]);

    return { comments: comments.map(toRecord), total };
  }

  async update(
    data: UpdateCardCommentSchema,
  ): Promise<CardCommentRecord | null> {
    const raw = await prisma.cardComment.update({
      where: { id: data.id },
      data: {
        content: data.content,
        mentions:
          data.mentions !== undefined
            ? (data.mentions as Prisma.InputJsonValue)
            : undefined,
        editedAt: new Date(),
      },
      include: authorInclude,
    });

    return toRecord(raw);
  }

  async softDelete(id: string, _cardId: string): Promise<void> {
    await prisma.cardComment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
