import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChartOfAccount } from '@/entities/finance/chart-of-account';
import type {
  ChartOfAccountsRepository,
  CreateChartOfAccountSchema,
  FindManyChartOfAccountsPaginatedResult,
  UpdateChartOfAccountSchema,
} from '../chart-of-accounts-repository';

export class InMemoryChartOfAccountsRepository
  implements ChartOfAccountsRepository
{
  public items: ChartOfAccount[] = [];

  async create(data: CreateChartOfAccountSchema): Promise<ChartOfAccount> {
    const chartOfAccount = ChartOfAccount.create({
      tenantId: new UniqueEntityID(data.tenantId),
      code: data.code,
      name: data.name,
      type: data.type,
      accountClass: data.accountClass,
      nature: data.nature,
      parentId: data.parentId ? new UniqueEntityID(data.parentId) : undefined,
      isActive: data.isActive ?? true,
      isSystem: data.isSystem ?? false,
    });

    this.items.push(chartOfAccount);
    return chartOfAccount;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ChartOfAccount | null> {
    const account = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return account ?? null;
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ChartOfAccount | null> {
    const account = this.items.find(
      (i) =>
        !i.deletedAt && i.code === code && i.tenantId.toString() === tenantId,
    );
    return account ?? null;
  }

  async findMany(tenantId: string): Promise<ChartOfAccount[]> {
    return this.items
      .filter((i) => !i.deletedAt && i.tenantId.toString() === tenantId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async findManyPaginated(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<FindManyChartOfAccountsPaginatedResult> {
    const all = this.items
      .filter((i) => !i.deletedAt && i.tenantId.toString() === tenantId)
      .sort((a, b) => a.code.localeCompare(b.code));
    const total = all.length;
    const offset = (page - 1) * limit;
    const chartOfAccounts = all.slice(offset, offset + limit);
    return { chartOfAccounts, total };
  }

  async findChildren(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<ChartOfAccount[]> {
    return this.items.filter(
      (i) =>
        !i.deletedAt &&
        i.parentId?.equals(parentId) &&
        i.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateChartOfAccountSchema,
  ): Promise<ChartOfAccount | null> {
    const account = this.items.find(
      (i) =>
        !i.deletedAt &&
        i.id.equals(data.id) &&
        i.tenantId.toString() === data.tenantId,
    );
    if (!account) return null;

    if (data.code !== undefined) account.code = data.code;
    if (data.name !== undefined) account.name = data.name;
    if (data.type !== undefined) account.type = data.type;
    if (data.accountClass !== undefined)
      account.accountClass = data.accountClass;
    if (data.nature !== undefined) account.nature = data.nature;
    if (data.parentId !== undefined)
      account.parentId = data.parentId
        ? new UniqueEntityID(data.parentId)
        : undefined;
    if (data.isActive !== undefined) account.isActive = data.isActive;

    return account;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const account = this.items.find(
      (i) =>
        !i.deletedAt &&
        i.id.equals(id) &&
        i.tenantId.toString() === tenantId,
    );
    if (account) account.delete();
  }
}
