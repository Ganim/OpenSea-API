import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryJournalEntriesRepository } from '@/repositories/finance/in-memory/in-memory-journal-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AutoJournalFromPaymentUseCase } from './auto-journal-from-payment';

const TENANT_ID = 'tenant-1';

let chartOfAccountsRepository: InMemoryChartOfAccountsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let financeCategoriesRepository: InMemoryFinanceCategoriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let journalEntriesRepository: InMemoryJournalEntriesRepository;
let sut: AutoJournalFromPaymentUseCase;

// Seeded IDs
let fornecedoresAccountId: string;
let clientesAccountId: string;
let bankChartOfAccountId: string;
let bankAccountId: string;
let categoryPayableId: string;
let categoryReceivableId: string;

async function seedChartOfAccounts() {
  const bankCoa = await chartOfAccountsRepository.create({
    tenantId: TENANT_ID,
    code: '1.1.1.02',
    name: 'Banco Conta Corrente',
    type: 'ASSET',
    accountClass: 'CURRENT',
    nature: 'DEBIT',
  });
  bankChartOfAccountId = bankCoa.id.toString();

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

  // Register accounts in the journal repo for metadata
  journalEntriesRepository.chartOfAccounts = [
    {
      id: bankChartOfAccountId,
      code: '1.1.1.02',
      name: 'Banco Conta Corrente',
      type: 'ASSET',
      nature: 'DEBIT',
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

async function seedBankAccount() {
  const bankAccount = await bankAccountsRepository.create({
    tenantId: TENANT_ID,
    name: 'Conta Principal',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    agency: '1234',
    accountNumber: '56789',
    accountType: 'CHECKING',
    chartOfAccountId: bankChartOfAccountId,
  });
  bankAccountId = bankAccount.id.toString();
}

async function seedCategories() {
  const payableCategory = await financeCategoriesRepository.create({
    tenantId: TENANT_ID,
    name: 'Fornecedores Gerais',
    slug: 'fornecedores-gerais',
    type: 'PAYABLE',
  });
  categoryPayableId = payableCategory.id.toString();

  const receivableCategory = await financeCategoriesRepository.create({
    tenantId: TENANT_ID,
    name: 'Vendas',
    slug: 'vendas',
    type: 'RECEIVABLE',
  });
  categoryReceivableId = receivableCategory.id.toString();
}

describe('AutoJournalFromPaymentUseCase', () => {
  beforeEach(async () => {
    chartOfAccountsRepository = new InMemoryChartOfAccountsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    financeCategoriesRepository = new InMemoryFinanceCategoriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    journalEntriesRepository = new InMemoryJournalEntriesRepository();

    sut = new AutoJournalFromPaymentUseCase(
      financeEntriesRepository,
      bankAccountsRepository,
      chartOfAccountsRepository,
      journalEntriesRepository,
    );

    await seedChartOfAccounts();
    await seedBankAccount();
    await seedCategories();
  });

  it('should generate settlement journal for PAYABLE (Debit fornecedores, Credit bank)', async () => {
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

    const paidAt = new Date('2025-01-08');
    const paymentId = 'payment-uuid-001';

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
      paymentId,
      bankAccountId,
      amount: 2500,
      paidAt,
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;

    expect(journalEntry.sourceType).toBe('FINANCE_PAYMENT');
    expect(journalEntry.sourceId).toBe(paymentId);
    expect(journalEntry.date).toEqual(paidAt);
    expect(journalEntry.description).toBe('Pagamento: Aluguel Janeiro');
    expect(journalEntry.lines).toHaveLength(2);

    const debitLine = journalEntry.lines.find((l) => l.type === 'DEBIT');
    const creditLine = journalEntry.lines.find((l) => l.type === 'CREDIT');

    // PAYABLE settlement: Debit fornecedores (clears liability), Credit bank (cash out)
    expect(debitLine?.chartOfAccountId).toBe(fornecedoresAccountId);
    expect(creditLine?.chartOfAccountId).toBe(bankChartOfAccountId);
    expect(debitLine?.amount).toBe(2500);
    expect(creditLine?.amount).toBe(2500);
  });

  it('should generate settlement journal for RECEIVABLE (Debit bank, Credit clientes)', async () => {
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

    const paidAt = new Date('2025-01-12');
    const paymentId = 'payment-uuid-002';

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
      paymentId,
      bankAccountId,
      amount: 1800,
      paidAt,
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;

    expect(journalEntry.sourceType).toBe('FINANCE_PAYMENT');

    const debitLine = journalEntry.lines.find((l) => l.type === 'DEBIT');
    const creditLine = journalEntry.lines.find((l) => l.type === 'CREDIT');

    // RECEIVABLE settlement: Debit bank (cash in), Credit clientes (clears asset)
    expect(debitLine?.chartOfAccountId).toBe(bankChartOfAccountId);
    expect(creditLine?.chartOfAccountId).toBe(clientesAccountId);
    expect(debitLine?.amount).toBe(1800);
    expect(creditLine?.amount).toBe(1800);
  });

  it('should return null when bank has no chartOfAccountId', async () => {
    // Create a bank account without chartOfAccountId
    const bankAccountNoCoA = await bankAccountsRepository.create({
      tenantId: TENANT_ID,
      name: 'Conta Sem CoA',
      bankCode: '341',
      bankName: 'Itaú',
      agency: '5678',
      accountNumber: '99999',
      accountType: 'CHECKING',
      // no chartOfAccountId
    });

    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-000003',
      description: 'Conta sem conta contábil bancária',
      categoryId: categoryPayableId,
      expectedAmount: 1000,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-10'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
      paymentId: 'payment-uuid-003',
      bankAccountId: bankAccountNoCoA.id.toString(),
      amount: 1000,
      paidAt: new Date('2025-01-08'),
    });

    expect(result).toBeNull();
  });

  it('should propagate companyId/costCenterId from parent entry to settlement journal (P1-13)', async () => {
    const companyId = 'company-xyz';
    const costCenterId = 'cc-vendas';

    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'RECEIVABLE',
      code: 'REC-PROP-001',
      description: 'Venda com contexto',
      categoryId: categoryReceivableId,
      companyId,
      costCenterId,
      expectedAmount: 700,
      issueDate: new Date('2025-01-05'),
      dueDate: new Date('2025-01-15'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
      paymentId: 'payment-uuid-prop-1',
      bankAccountId,
      amount: 700,
      paidAt: new Date('2025-01-12'),
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

  it('should use payment amount, not entry expected amount (supports partial payments)', async () => {
    const entry = await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-000004',
      description: 'Pagamento Parcial',
      categoryId: categoryPayableId,
      expectedAmount: 5000,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-30'),
    });

    const partialAmount = 2000; // partial payment, not 5000

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entryId: entry.id.toString(),
      paymentId: 'payment-uuid-004',
      bankAccountId,
      amount: partialAmount,
      paidAt: new Date('2025-01-15'),
    });

    expect(result).not.toBeNull();
    const { journalEntry } = result!;

    // Lines should use the partial amount, not 5000
    expect(journalEntry.lines[0].amount).toBe(partialAmount);
    expect(journalEntry.lines[1].amount).toBe(partialAmount);
  });
});
