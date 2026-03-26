import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { AccountantAccessesRepository } from '@/repositories/finance/accountant-accesses-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface GetAccountantDataRequest {
  accessToken: string;
  year: number;
  month: number;
}

interface AccountantDataCategory {
  id: string;
  name: string;
  type: string;
}

interface AccountantDataEntry {
  id: string;
  code: string;
  description: string;
  type: string;
  status: string;
  expectedAmount: number;
  actualAmount: number | null;
  dueDate: Date;
  paymentDate: Date | null;
  categoryId: string;
  categoryName?: string;
}

interface AccountantDataSummary {
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  entryCount: number;
}

export interface GetAccountantDataResponse {
  tenantName: string;
  period: { year: number; month: number };
  categories: AccountantDataCategory[];
  entries: AccountantDataEntry[];
  summary: AccountantDataSummary;
}

export class GetAccountantDataUseCase {
  constructor(
    private accountantAccessesRepository: AccountantAccessesRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute(
    request: GetAccountantDataRequest,
  ): Promise<GetAccountantDataResponse> {
    const { accessToken, year, month } = request;

    // Validate token
    const access =
      await this.accountantAccessesRepository.findByToken(accessToken);

    if (!access) {
      throw new UnauthorizedError('Token de acesso inválido.');
    }

    if (!access.isActive) {
      throw new UnauthorizedError('Acesso desativado.');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      throw new UnauthorizedError('Token de acesso expirado.');
    }

    // Update last access
    await this.accountantAccessesRepository.updateLastAccess(access.id);

    const tenantId = access.tenantId;

    // Fetch period data
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const categories = await this.financeCategoriesRepository.findMany(
      tenantId,
    );

    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      dueDateFrom: startDate,
      dueDateTo: endDate,
      limit: 10000,
    });

    // Build category map
    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.id.toString(), cat.name);
    }

    // Map entries
    const mappedEntries: AccountantDataEntry[] = entries.map((e) => ({
      id: e.id.toString(),
      code: e.code,
      description: e.description,
      type: e.type,
      status: e.status,
      expectedAmount: e.expectedAmount,
      actualAmount: e.actualAmount ?? null,
      dueDate: e.dueDate,
      paymentDate: e.paymentDate ?? null,
      categoryId: e.categoryId.toString(),
      categoryName: categoryMap.get(e.categoryId.toString()),
    }));

    // Calculate summary
    const paidStatuses = ['PAID', 'RECEIVED', 'PARTIALLY_PAID'];
    const totalRevenue = entries
      .filter(
        (e) => e.type === 'RECEIVABLE' && paidStatuses.includes(e.status),
      )
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    const totalExpenses = entries
      .filter((e) => e.type === 'PAYABLE' && paidStatuses.includes(e.status))
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    return {
      tenantName: '', // Will be populated from middleware context
      period: { year, month },
      categories: categories.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        type: c.type,
      })),
      entries: mappedEntries,
      summary: {
        totalRevenue,
        totalExpenses,
        netResult: totalRevenue - totalExpenses,
        entryCount: entries.length,
      },
    };
  }
}
