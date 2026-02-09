import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankAccount } from '@/entities/finance/bank-account';
import type {
  BankAccountsRepository,
  CreateBankAccountSchema,
  UpdateBankAccountSchema,
} from '../bank-accounts-repository';

export class InMemoryBankAccountsRepository implements BankAccountsRepository {
  public items: BankAccount[] = [];

  async create(data: CreateBankAccountSchema): Promise<BankAccount> {
    const bankAccount = BankAccount.create({
      tenantId: new UniqueEntityID(data.tenantId),
      companyId: new UniqueEntityID(data.companyId),
      name: data.name,
      bankCode: data.bankCode,
      bankName: data.bankName,
      agency: data.agency,
      agencyDigit: data.agencyDigit,
      accountNumber: data.accountNumber,
      accountDigit: data.accountDigit,
      accountType: data.accountType,
      pixKeyType: data.pixKeyType,
      pixKey: data.pixKey,
      color: data.color,
      isDefault: data.isDefault ?? false,
    });

    this.items.push(bankAccount);
    return bankAccount;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<BankAccount | null> {
    const item = this.items.find(
      (i) => !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<BankAccount[]> {
    return this.items.filter(
      (i) => !i.deletedAt && i.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateBankAccountSchema): Promise<BankAccount | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.name !== undefined) item.name = data.name;
    if (data.bankName !== undefined) item.bankName = data.bankName;
    if (data.agency !== undefined) item.agency = data.agency;
    if (data.agencyDigit !== undefined) item.agencyDigit = data.agencyDigit;
    if (data.accountNumber !== undefined) item.accountNumber = data.accountNumber;
    if (data.accountDigit !== undefined) item.accountDigit = data.accountDigit;
    if (data.accountType !== undefined) item.accountType = data.accountType;
    if (data.status !== undefined) item.status = data.status;
    if (data.pixKeyType !== undefined) item.pixKeyType = data.pixKeyType;
    if (data.pixKey !== undefined) item.pixKey = data.pixKey;
    if (data.color !== undefined) item.color = data.color;
    if (data.isDefault !== undefined) item.isDefault = data.isDefault;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
