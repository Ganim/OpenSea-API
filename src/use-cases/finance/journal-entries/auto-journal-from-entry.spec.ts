import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AutoJournalFromEntryUseCase } from './auto-journal-from-entry';

const TENANT_ID = 'tenant-1';

let chartOfAccountsRepository: InMemoryChartOfAccountsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let financeCategoriesRepository: InMemoryFinanceCategoriesRepository;
let journalEntriesRepository: InMemoryJournalEntriesRepository;
let sut: AutoJournalFromEntryUseCase;

// Seeded IDs
let expenseAccountId: string;
let revenueAccountId: string;
let fornecedoresAccountId: string;
let clientesAccountId: string;
let categoryPayableId: string;
let categoryReceivableId: string;

async function seedChartOfAccounts() {
  const expenseAccount = await chartOfAccountsRepository.create({
    tenantId: TENANT_ID,
    code: '3.1.1.01',
    name: 'Despesas Operacionais',
    type: 'EXPENSE',
    accountClass: 'OPERATIONAL',
    nature: 'DEBIT',
  });
  expenseAccountId = expenseAccount.id.toString();

  const revenueAccount = await chartOfAccountsRepository.create({
    tenantId: TENANT_ID,
    code: '4.1.1.01',
    name: 'Receitas Operacionais',
    type: 'REVENUE',
    accountClass: 'OPERATIONAL',
    nature: 'CREDIT',
  });
  revenueAccountId = revenueAccount.id.toString();

  const fornecedoresAccount = await chartOfAccountsRepository.create({
    tenantId: TENANT_ID,
    code: '2.1.1.01',
    name: 'Fornecedores',
    type: 'LIABILITY',
    accountClass: 'CURRENT',
    nature: 'CREDIT',
  });
  fornecedoresAccountId = fornecedoresAccount.id.toString();

  const clientesAccount = await chartOfAccountsRepository.create({
    tenantId: TENANT_ID,
    code: '1.1.2.01',
    name: 'Clientes',
    type: 'ASSET',
    accountClass: 'CURRENT',
    nature: 'DEBIT',
  });
  clientesAccountId = clientesAccount.id.toString();

  // Register accounts in the journal repo for metadata lookup
  journalEntriesRepository.chartOfAccounts = [
    {
      id: expenseAccountId,
      code: '3.1.1.01',
      name: 'Despesas Operacionais',
      type: 'EXPENSE',
      nature: 'DEBIT',
    },
    {
      id: revenueAccountId,
      code: '4.1.1.01',
      name: 'Receitas Operacionais',
      type: 'REVENUE',
      nature: 'CREDIT',
    },
    {
      id: fornecedoresAccountId,
      code: '2.1.1.01',
      name: 'Fornecedores',
      type: 'LIABILITY',
      nature: 'CREDIT',
    },
    {
      id: clientesAccountId,
      code: '1.1.2.01',
      name: 'Clientes',
      type: 'ASSET',
      nature: 'DEBIT',
    },
  ];
}

async function seedCategories() {
  const payableCategory = await financeCategoriesRepository.create({
    tenantId: TENANT_ID,
    name: 'Fornecedores Gerais',
    slug: 'fornecedores-gerais',
    type: 'PAYABLE',
    chartOfAccountId: expenseAccountId,
  });
  categoryPayableId = payableCategory.id.toString();

  const receivableCategory = await financeCategoriesRepository.create({
    tenantId: TENANT_ID,
    name: 'Vendas',
    slug: 'vendas',
    type: 'RECEIVABLE',
    chartOfAccountId: revenueAccountId,
  });
  categoryReceivableId = receivableCategory.id.toString();
}

describe('AutoJournalFromEntryUseCase', () => {
  beforeEach(async () => {
    chartOfAccountsRepository = new InMemoryChartOfAccountsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    financeCategoriesRepository = new InMemoryFinanceCategoriesRepository();
    journalEntriesRepository = new InMemoryJournalEntriesRepository();

    sut = new AutoJournalFromEntryUseCase(
      financeEntriesRepository,
      financeCategoriesRepository,
      chartOfAccountsRepository,
      journalEntriesRepository,
    );

    await seedChartOfAccounts();
    await seedCategories();
  });

  it('should generate provisioning journal for PAYABLE (Debit expense, Credit fornecedores)', async () => {
    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-000001',
      description: 'Aluguel Janeiro',
      categoryId: categoryPayableId,
      expectedAmount: 2500,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-10'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;

    expect(journalEntry.sourceType).toBe('FINANCE_ENTRY');
    expect(journalEntry.sourceId).toBe(entry.id.toString());
    expect(journalEntry.lines).toHaveLength(2);

    const debitLine = journalEntry.lines.find((l) => l.type === 'DEBIT');
    const creditLine = journalEntry.lines.find((l) => l.type === 'CREDIT');

    expect(debitLine?.chartOfAccountId).toBe(expenseAccountId);
    expect(creditLine?.chartOfAccountId).toBe(fornecedoresAccountId);
    expect(debitLine?.amount).toBe(2500);
    expect(creditLine?.amount).toBe(2500);
  });

  it('should generate provisioning journal for RECEIVABLE (Debit clientes, Credit revenue)', async () => {
    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'RECEIVABLE',
      code: 'REC-000001',
      description: 'Venda de Produto',
      categoryId: categoryReceivableId,
      expectedAmount: 1800,
      issueDate: new Date('2025-01-05'),
      dueDate: new Date('2025-01-15'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;

    expect(journalEntry.sourceType).toBe('FINANCE_ENTRY');
    const debitLine = journalEntry.lines.find((l) => l.type === 'DEBIT');
    const creditLine = journalEntry.lines.find((l) => l.type === 'CREDIT');

    expect(debitLine?.chartOfAccountId).toBe(clientesAccountId);
    expect(creditLine?.chartOfAccountId).toBe(revenueAccountId);
    expect(debitLine?.amount).toBe(1800);
    expect(creditLine?.amount).toBe(1800);
  });

  it('should use entry.chartOfAccountId when set (override)', async () => {
    // Create another expense account to use as override
    const overrideAccount = await chartOfAccountsRepository.create({
      tenantId: TENANT_ID,
      code: '3.2.1.01',
      name: 'Despesas de Marketing',
      type: 'EXPENSE',
      accountClass: 'OPERATIONAL',
      nature: 'DEBIT',
    });
    const overrideAccountId = overrideAccount.id.toString();

    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-000002',
      description: 'Campanha Publicitária',
      categoryId: categoryPayableId,
      chartOfAccountId: overrideAccountId, // explicit override
      expectedAmount: 3000,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-20'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).not.toBeNull();
    const debitLine = result!.journalEntry.lines.find(
      (l) => l.type === 'DEBIT',
    );
    // Should use the override account, not the category's account
    expect(debitLine?.chartOfAccountId).toBe(overrideAccountId);
  });

  it('should use category.chartOfAccountId as fallback when entry has no override', async () => {
    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-000003',
      description: 'Serviço de Limpeza',
      categoryId: categoryPayableId,
      // no chartOfAccountId override
      expectedAmount: 500,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-10'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).not.toBeNull();
    const debitLine = result!.journalEntry.lines.find(
      (l) => l.type === 'DEBIT',
    );
    // Should fall back to category's chartOfAccountId (expenseAccountId)
    expect(debitLine?.chartOfAccountId).toBe(expenseAccountId);
  });

  it('should propagate companyId and costCenterId from entry to header and lines (P1-13)', async () => {
    const companyId = 'company-abc';
    const costCenterId = 'cc-marketing';

    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-PROP-001',
      description: 'Aluguel com contexto',
      categoryId: categoryPayableId,
      companyId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-10'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;

    expect(journalEntry.companyId).toBe(companyId);
    expect(journalEntry.costCenterId).toBe(costCenterId);
    for (const line of journalEntry.lines) {
      expect(line.companyId).toBe(companyId);
      expect(line.costCenterId).toBe(costCenterId);
    }
  });

  it('should keep companyId/costCenterId null when entry omits them', async () => {
    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'RECEIVABLE',
      code: 'REC-PROP-NULL',
      description: 'Venda sem contexto',
      categoryId: categoryReceivableId,
      expectedAmount: 200,
      issueDate: new Date('2025-01-05'),
      dueDate: new Date('2025-01-15'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;
    expect(journalEntry.companyId).toBeNull();
    expect(journalEntry.costCenterId).toBeNull();
    for (const line of journalEntry.lines) {
      expect(line.companyId).toBeNull();
      expect(line.costCenterId).toBeNull();
    }
  });

  it('should return null when no account mapping exists', async () => {
    // Create category with no chartOfAccountId
    const unmappedCategory = await financeCategoriesRepository.create({
      tenantId: TENANT_ID,
      name: 'Categoria Sem Conta',
      slug: 'sem-conta',
      type: 'PAYABLE',
      // no chartOfAccountId
    });

    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-000004',
      description: 'Sem mapeamento contábil',
      categoryId: unmappedCategory.id.toString(),
      // no chartOfAccountId override
      expectedAmount: 100,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-10'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
    });

    expect(result).toBeNull();
  });
});
