import { MagicLinkToken } from '@/entities/core/magic-link-token';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type {
  CreateMagicLinkTokenSchema,
  MagicLinkTokensRepository,
} from '../magic-link-tokens-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToDomain(raw: any): MagicLinkToken {
  return MagicLinkToken.create(
    {
      userId: raw.userId,
      token: raw.token,
      email: raw.email,
      expiresAt: raw.expiresAt,
      usedAt: raw.usedAt ?? null,
      createdAt: raw.createdAt,
    },
    raw.id,
  );
}

export class PrismaMagicLinkTokensRepository
  implements MagicLinkTokensRepository
{
  // CREATE
  // - create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken>;

  async create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken> {
    const raw = await prisma.magicLinkToken.create({
      data: {
        userId: data.userId.toString(),
        token: data.token,
        email: data.email,
        expiresAt: data.expiresAt,
      },
    });

    return mapToDomain(raw);
  }

  // RETRIEVE
  // - findByToken(tokenHash: string): Promise<MagicLinkToken | null>;

  async findByToken(tokenHash: string): Promise<MagicLinkToken | null> {
    const raw = await prisma.magicLinkToken.findFirst({
      where: { token: tokenHash },
    });

    if (!raw) return null;

    return mapToDomain(raw);
  }

  // UPDATE
  // - markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null>;

  async markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null> {
    try {
      const raw = await prisma.magicLinkToken.update({
        where: { id: id.toString() },
        data: { usedAt: new Date() },
      });

      return mapToDomain(raw);
    } catch {
      return null;
    }
  }

  // DELETE
  // - deleteExpired(): Promise<number>;

  async deleteExpired(): Promise<number> {
    const result = await prisma.magicLinkToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        usedAt: null,
      },
    });

    return result.count;
  }
}
