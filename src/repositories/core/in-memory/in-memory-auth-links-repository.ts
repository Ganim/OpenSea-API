import { AuthLink } from '@/entities/core/auth-link';
import type { AuthLinkProvider, AuthLinkStatus } from '@/entities/core/auth-link';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  AuthLinksRepository,
  CreateAuthLinkSchema,
} from '@/repositories/core/auth-links-repository';

export class InMemoryAuthLinksRepository implements AuthLinksRepository {
  // IN MEMORY DATABASE
  private items: AuthLink[] = [];

  // CREATE
  // - create(data: CreateAuthLinkSchema): Promise<AuthLink>;

  async create(data: CreateAuthLinkSchema, _tx?: unknown): Promise<AuthLink> {
    const authLink = AuthLink.create(
      {
        userId: data.userId,
        tenantId: data.tenantId ?? null,
        provider: data.provider,
        identifier: data.identifier,
        credential: data.credential ?? null,
        metadata: data.metadata ?? null,
        status: data.status ?? 'ACTIVE',
      },
      new UniqueEntityID(),
    );

    this.items.push(authLink);

    return authLink;
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
    const item = this.items.find((item) => item.id.equals(id));

    if (!item) return null;

    return item;
  }

  async findByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    const item = this.items.find(
      (item) =>
        item.provider === provider &&
        item.identifier === identifier &&
        item.unlinkedAt === null,
    );

    if (!item) return null;

    return item;
  }

  async findActiveByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null> {
    const item = this.items.find(
      (item) =>
        item.provider === provider &&
        item.identifier === identifier &&
        item.unlinkedAt === null &&
        item.status === 'ACTIVE',
    );

    if (!item) return null;

    return item;
  }

  async findByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    return this.items.filter((item) => item.userId.equals(userId));
  }

  async findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]> {
    return this.items.filter(
      (item) =>
        item.userId.equals(userId) &&
        item.status === 'ACTIVE' &&
        item.unlinkedAt === null,
    );
  }

  async findByUserIdAndProvider(
    userId: UniqueEntityID,
    provider: AuthLinkProvider,
  ): Promise<AuthLink | null> {
    const item = this.items.find(
      (item) =>
        item.userId.equals(userId) &&
        item.provider === provider &&
        item.unlinkedAt === null,
    );

    if (!item) return null;

    return item;
  }

  async countActiveByUserId(userId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) =>
        item.userId.equals(userId) &&
        item.status === 'ACTIVE' &&
        item.unlinkedAt === null,
    ).length;
  }

  // UPDATE
  // - updateStatus(id: UniqueEntityID, status: AuthLinkStatus): Promise<AuthLink | null>;
  // - updateCredentialByUserId(userId: UniqueEntityID, credential: string): Promise<number>;
  // - updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void>;

  async updateStatus(
    id: UniqueEntityID,
    status: AuthLinkStatus,
  ): Promise<AuthLink | null> {
    const item = this.items.find((item) => item.id.equals(id));

    if (!item) return null;

    item.status = status;

    return item;
  }

  async updateCredentialByUserId(
    userId: UniqueEntityID,
    credential: string,
  ): Promise<number> {
    const matching = this.items.filter(
      (item) =>
        item.userId.equals(userId) &&
        item.credential !== null &&
        item.unlinkedAt === null,
    );

    for (const item of matching) {
      item.updateCredential(credential);
    }

    return matching.length;
  }

  async updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void> {
    const item = this.items.find((item) => item.id.equals(id));

    if (item) {
      item.lastUsedAt = date;
    }
  }

  // DELETE
  // - softDelete(id: UniqueEntityID): Promise<AuthLink | null>;
  // - delete(id: UniqueEntityID): Promise<void>;

  async softDelete(id: UniqueEntityID): Promise<AuthLink | null> {
    const item = this.items.find((item) => item.id.equals(id));

    if (!item) return null;

    item.unlink();

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }
}
