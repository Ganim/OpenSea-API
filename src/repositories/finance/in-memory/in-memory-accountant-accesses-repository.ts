import { randomUUID } from 'node:crypto';
import type {
  AccountantAccessesRepository,
  AccountantAccessRecord,
  CreateAccountantAccessSchema,
} from '../accountant-accesses-repository';

export class InMemoryAccountantAccessesRepository
  implements AccountantAccessesRepository
{
  public items: AccountantAccessRecord[] = [];

  async create(
    data: CreateAccountantAccessSchema,
  ): Promise<AccountantAccessRecord> {
    const record: AccountantAccessRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      email: data.email,
      name: data.name,
      cpfCnpj: data.cpfCnpj ?? null,
      crc: data.crc ?? null,
      accessToken: data.accessToken,
      isActive: true,
      lastAccessAt: null,
      expiresAt: data.expiresAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<AccountantAccessRecord | null> {
    return (
      this.items.find((i) => i.id === id && i.tenantId === tenantId) ?? null
    );
  }

  async findByToken(token: string): Promise<AccountantAccessRecord | null> {
    return this.items.find((i) => i.accessToken === token) ?? null;
  }

  async findByEmail(
    tenantId: string,
    email: string,
  ): Promise<AccountantAccessRecord | null> {
    return (
      this.items.find((i) => i.tenantId === tenantId && i.email === email) ??
      null
    );
  }

  async findMany(tenantId: string): Promise<AccountantAccessRecord[]> {
    return this.items
      .filter((i) => i.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    const item = this.items.find((i) => i.id === id && i.tenantId === tenantId);
    if (item) {
      item.isActive = false;
      item.updatedAt = new Date();
    }
  }

  async updateLastAccess(id: string): Promise<void> {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.lastAccessAt = new Date();
      item.updatedAt = new Date();
    }
  }
}
