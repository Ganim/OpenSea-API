import { AuthLink } from '@/entities/core/auth-link';
import type {
  AuthLinkProvider,
  AuthLinkStatus,
} from '@/entities/core/auth-link';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import type {
  AuthLinksRepository,
  CreateAuthLinkSchema,
} from '../auth-links-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToDomain(raw: any): AuthLink {
  return AuthLink.create(
    {
      userId: new UniqueEntityID(raw.userId),
      tenantId: raw.tenantId ? new UniqueEntityID(raw.tenantId) : null,
      provider: raw.provider,
      identifier: raw.identifier,
      credential: raw.credential ?? null,
      metadata: raw.metadata as Record<string, unknown> | null,
      status: raw.status,
      linkedAt: raw.linkedAt,
      unlinkedAt: raw.unlinkedAt ?? null,
      lastUsedAt: raw.lastUsedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaAuthLinksRepository implements AuthLinksRepository {
  // CREATE
  // - create(data: CreateAuthLinkSchema, tx?: TransactionClient): Promise<AuthLink>;

  async create(
    data: CreateAuthLinkSchema,
    tx?: TransactionClient,
  ): Promise<AuthLink> {
    const client = tx ?? prisma;

    const raw = await client.authLink.create({
      data: {
        userId: data.userId.toString(),
        tenantId: data.tenantId ? data.tenantId.toString() : null,
        provider: data.provider,
        identifier: data.identifier,
        credential: data.credential ?? null,
        metadata: data.metadata
          ? (data.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        status: data.status ?? 'ACTIVE',
      },
    });

    return mapToDomain(raw);
  }

  // RETRIEVE
  // - findById(id: UniqueEntityID): Promise<AuthLink | null>;
  // - findByProviderAndIdentifier(provider: AuthLinkProvider, identifier: string): Promise<AuthLink | null>;
  // - findActiveByProviderAndIdentifier(provider: AuthLinkProvider, identifier: string): Promise<AuthLink | null>;
  // - findByUserId(userId: UniqueEntityID): Promise<AuthLink[]>;
  // - findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]>;
  // - findByUserIdAndProvider(userId: UniqueEntityID, provider: AuthLinkProvider): Promise<AuthLink | null>;
  // - countActiveByUserId(userId: UniqueEntityID): Promise<number>;

  async findById(id: UniqueEntityID): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) return null;

    return mapToDomain(raw);
  }

  async findByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: {
        provider,
        identifier,
        unlinkedAt: null,
      },
    });

    if (!raw) return null;

    return mapToDomain(raw);
  }

  async findActiveByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: {
        provider,
        identifier,
        unlinkedAt: null,
        status: 'ACTIVE',
      },
    });

    if (!raw) return null;

    return mapToDomain(raw);
  }

  async findByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    const rows = await prisma.authLink.findMany({
      where: { userId: userId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(mapToDomain);
  }

  async findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    const rows = await prisma.authLink.findMany({
      where: {
        userId: userId.toString(),
        status: 'ACTIVE',
        unlinkedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(mapToDomain);
  }

  async findByUserIdAndProvider(
    userId: UniqueEntityID,
    provider: AuthLinkProvider,
  ): Promise<AuthLink | null> {
    const raw = await prisma.authLink.findFirst({
      where: {
        userId: userId.toString(),
        provider,
        unlinkedAt: null,
      },
    });

    if (!raw) return null;

    return mapToDomain(raw);
  }

  async countActiveByUserId(userId: UniqueEntityID): Promise<number> {
    return prisma.authLink.count({
      where: {
        userId: userId.toString(),
        status: 'ACTIVE',
        unlinkedAt: null,
      },
    });
  }

  // UPDATE
  // - updateStatus(id: UniqueEntityID, status: AuthLinkStatus): Promise<AuthLink | null>;
  // - updateCredentialByUserId(userId: UniqueEntityID, credential: string): Promise<number>;
  // - updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void>;

  async updateStatus(
    id: UniqueEntityID,
    status: AuthLinkStatus,
  ): Promise<AuthLink | null> {
    try {
      const raw = await prisma.authLink.update({
        where: { id: id.toString() },
        data: { status },
      });

      return mapToDomain(raw);
    } catch {
      return null;
    }
  }

  async updateCredentialByUserId(
    userId: UniqueEntityID,
    credential: string,
  ): Promise<number> {
    const result = await prisma.authLink.updateMany({
      where: {
        userId: userId.toString(),
        credential: { not: null },
        unlinkedAt: null,
      },
      data: { credential },
    });

    return result.count;
  }

  async updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void> {
    await prisma.authLink.update({
      where: { id: id.toString() },
      data: { lastUsedAt: date },
    });
  }

  // DELETE
  // - softDelete(id: UniqueEntityID): Promise<AuthLink | null>;
  // - delete(id: UniqueEntityID): Promise<void>;

  async softDelete(id: UniqueEntityID): Promise<AuthLink | null> {
    try {
      const raw = await prisma.authLink.update({
        where: { id: id.toString() },
        data: {
          unlinkedAt: new Date(),
          status: 'INACTIVE',
        },
      });

      return mapToDomain(raw);
    } catch {
      return null;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.authLink.delete({
      where: { id: id.toString() },
    });
  }
}
