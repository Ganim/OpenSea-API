import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccount } from '@/entities/finance/bank-account';

export interface CreateBankAccountSchema {
  tenantId: string;
  companyId: string;
  name: string;
  bankCode: string;
  bankName?: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: string;
  pixKeyType?: string;
  pixKey?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateBankAccountSchema {
  id: UniqueEntityID;
  name?: string;
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: string;
  status?: string;
  pixKeyType?: string;
  pixKey?: string;
  color?: string;
  isDefault?: boolean;
}

export interface BankAccountsRepository {
  create(data: CreateBankAccountSchema): Promise<BankAccount>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BankAccount | null>;
  findMany(tenantId: string): Promise<BankAccount[]>;
  update(data: UpdateBankAccountSchema): Promise<BankAccount | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
