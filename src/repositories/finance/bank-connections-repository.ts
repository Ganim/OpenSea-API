import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface BankConnectionRecord {
  id: string;
  tenantId: string;
  bankAccountId: string;
  provider: string;
  externalItemId: string;
  accessToken: string;
  status: string;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBankConnectionSchema {
  tenantId: string;
  bankAccountId: string;
  provider?: string;
  externalItemId: string;
  accessToken: string;
}

export interface UpdateBankConnectionSchema {
  id: UniqueEntityID;
  tenantId: string;
  status?: string;
  accessToken?: string;
  lastSyncAt?: Date;
}

export interface BankConnectionsRepository {
  create(data: CreateBankConnectionSchema): Promise<BankConnectionRecord>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BankConnectionRecord | null>;
  findByBankAccountId(
    bankAccountId: string,
    tenantId: string,
  ): Promise<BankConnectionRecord | null>;
  findMany(tenantId: string): Promise<BankConnectionRecord[]>;
  update(
    data: UpdateBankConnectionSchema,
  ): Promise<BankConnectionRecord | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
