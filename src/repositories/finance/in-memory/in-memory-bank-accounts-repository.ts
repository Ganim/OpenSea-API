import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankAccount } from '@/entities/finance/bank-account';
import type {
  BankAccountsRepository,
  CreateBankAccountSchema,
  FindManyBankAccountsOptions,
  FindManyBankAccountsResult,
  UpdateBankAccountSchema,
} from '../bank-accounts-repository';

export class InMemoryBankAccountsRepository implements BankAccountsRepository {
  public items: BankAccount[] = [];

  async create(data: CreateBankAccountSchema): Promise<BankAccount> {
    const bankAccount = BankAccount.create({
      tenantId: new UniqueEntityID(data.tenantId),
      companyId: data.companyId
        ? new UniqueEntityID(data.companyId)
        : undefined,
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
      chartOfAccountId: data.chartOfAccountId,
      color: data.color,
      isDefault: data.isDefault ?? false,
      apiEnabled: data.apiEnabled ?? false,
    });

    this.items.push(bankAccount);
    return bankAccount;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BankAccount | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<BankAccount[]> {
    return this.items.filter(
      (i) => !i.deletedAt && i.tenantId.toString() === tenantId,
    );
  }

  async findManyPaginated(
    options: FindManyBankAccountsOptions,
  ): Promise<FindManyBankAccountsResult> {
    const {
      tenantId,
      page = 1,
      limit = 20,
      search,
      companyId,
      accountType,
      status,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    let filtered = this.items.filter(
      (i) => !i.deletedAt && i.tenantId.toString() === tenantId,
    );

    if (companyId) {
      filtered = filtered.filter((i) => i.companyId?.toString() === companyId);
    }
    if (accountType) {
      filtered = filtered.filter((i) => i.accountType === accountType);
    }
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.bankName ?? '').toLowerCase().includes(q) ||
          i.bankCode.toLowerCase().includes(q),
      );
    }

    const direction = sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const av =
        sortBy === 'createdAt'
          ? a.createdAt.getTime()
          : ((a as unknown as Record<string, string>)[sortBy] ?? '');
      const bv =
        sortBy === 'createdAt'
          ? b.createdAt.getTime()
          : ((b as unknown as Record<string, string>)[sortBy] ?? '');
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const bankAccounts = filtered.slice(start, start + limit);

    return { bankAccounts, total };
  }

  async update(data: UpdateBankAccountSchema): Promise<BankAccount | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.name !== undefined) item.name = data.name;
    if (data.bankName !== undefined) item.bankName = data.bankName;
    if (data.agency !== undefined) item.agency = data.agency;
    if (data.agencyDigit !== undefined) item.agencyDigit = data.agencyDigit;
    if (data.accountNumber !== undefined)
      item.accountNumber = data.accountNumber;
    if (data.accountDigit !== undefined) item.accountDigit = data.accountDigit;
    if (data.accountType !== undefined) item.accountType = data.accountType;
    if (data.status !== undefined) item.status = data.status;
    if (data.pixKeyType !== undefined) item.pixKeyType = data.pixKeyType;
    if (data.pixKey !== undefined) item.pixKey = data.pixKey;
    if (data.chartOfAccountId !== undefined)
      item.chartOfAccountId = data.chartOfAccountId ?? undefined;
    if (data.color !== undefined) item.color = data.color;
    if (data.isDefault !== undefined) item.isDefault = data.isDefault;

    return item;
  }

  async delete(id: UniqueEntityID, _tenantId?: string): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
