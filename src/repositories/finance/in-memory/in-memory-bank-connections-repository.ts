import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { randomUUID } from 'node:crypto';
import type {
  BankConnectionRecord,
  BankConnectionsRepository,
  CreateBankConnectionSchema,
  UpdateBankConnectionSchema,
} from '../bank-connections-repository';

export class InMemoryBankConnectionsRepository
  implements BankConnectionsRepository
{
  public items: BankConnectionRecord[] = [];

  async create(
    data: CreateBankConnectionSchema,
  ): Promise<BankConnectionRecord> {
    const record: BankConnectionRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      bankAccountId: data.bankAccountId,
      provider: data.provider ?? 'PLUGGY',
      externalItemId: data.externalItemId,
      accessToken: data.accessToken,
      status: 'ACTIVE',
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BankConnectionRecord | null> {
    return (
      this.items.find(
        (item) => item.id === id.toString() && item.tenantId === tenantId,
      ) ?? null
    );
  }

  async findByBankAccountId(
    bankAccountId: string,
    tenantId: string,
  ): Promise<BankConnectionRecord | null> {
    return (
      this.items.find(
        (item) =>
          item.bankAccountId === bankAccountId &&
          item.tenantId === tenantId &&
          item.status !== 'REVOKED',
      ) ?? null
    );
  }

  async findMany(tenantId: string): Promise<BankConnectionRecord[]> {
    return this.items.filter((item) => item.tenantId === tenantId);
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (item) => item.tenantId === tenantId && item.status === 'ACTIVE',
    ).length;
  }

  async update(
    data: UpdateBankConnectionSchema,
  ): Promise<BankConnectionRecord | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id === data.id.toString() && item.tenantId === data.tenantId,
    );

    if (index === -1) return null;

    const existing = this.items[index];
    const updated: BankConnectionRecord = {
      ...existing,
      status: data.status ?? existing.status,
      accessToken: data.accessToken ?? existing.accessToken,
      lastSyncAt: data.lastSyncAt ?? existing.lastSyncAt,
      updatedAt: new Date(),
    };

    this.items[index] = updated;
    return updated;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id === id.toString() && item.tenantId === tenantId,
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
