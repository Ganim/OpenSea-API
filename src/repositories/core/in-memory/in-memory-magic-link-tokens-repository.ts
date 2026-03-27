import { MagicLinkToken } from '@/entities/core/magic-link-token';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateMagicLinkTokenSchema,
  MagicLinkTokensRepository,
} from '@/repositories/core/magic-link-tokens-repository';

export class InMemoryMagicLinkTokensRepository
  implements MagicLinkTokensRepository
{
  // IN MEMORY DATABASE
  private items: MagicLinkToken[] = [];

  // CREATE
  // - create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken>;

  async create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken> {
    const token = MagicLinkToken.create(
      {
        userId: data.userId,
        token: data.token,
        email: data.email,
        expiresAt: data.expiresAt,
      },
      new UniqueEntityID(),
    );

    this.items.push(token);

    return token;
  }

  // RETRIEVE
  // - findByToken(tokenHash: string): Promise<MagicLinkToken | null>;

  async findByToken(tokenHash: string): Promise<MagicLinkToken | null> {
    const item = this.items.find((item) => item.token === tokenHash);

    if (!item) return null;

    return item;
  }

  // UPDATE
  // - markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null>;

  async markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null> {
    const item = this.items.find((item) => item.id.equals(id));

    if (!item) return null;

    item.markAsUsed();

    return item;
  }

  // DELETE
  // - deleteExpired(): Promise<number>;

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const expiredCount = this.items.filter(
      (item) => item.expiresAt < now && item.usedAt === null,
    ).length;

    this.items = this.items.filter(
      (item) => !(item.expiresAt < now && item.usedAt === null),
    );

    return expiredCount;
  }
}
