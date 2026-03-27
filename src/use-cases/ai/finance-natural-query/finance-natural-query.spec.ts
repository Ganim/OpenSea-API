import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { FinanceNaturalQueryUseCase } from './finance-natural-query';

let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: FinanceNaturalQueryUseCase;

describe('FinanceNaturalQueryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    sut = new FinanceNaturalQueryUseCase(
      entriesRepository,
      bankAccountsRepository,
    );
  });

  it('should detect EXPENSES_TOTAL intent for "quanto gastei"', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PAID',
      actualAmount: 2000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'quanto gastei este mês?',
    });

    expect(result.intent).toBe('EXPENSES_TOTAL');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.answer).toContain('despesas');
  });

  it('should detect INCOME_TOTAL intent for "quanto recebi"', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda',
      categoryId: 'cat-1',
      expectedAmount: 5000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'RECEIVED',
      actualAmount: 5000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'quanto recebi este mês?',
    });

    expect(result.intent).toBe('INCOME_TOTAL');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.answer).toContain('receitas');
  });

  it('should detect OVERDUE_ENTRIES intent for "contas vencidas"', async () => {
    const pastDate = new Date('2025-01-01');

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta atrasada',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      issueDate: new Date('2024-12-01'),
      dueDate: pastDate,
      status: 'OVERDUE',
      supplierName: 'Fornecedor ABC',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'quais contas estão vencidas?',
    });

    expect(result.intent).toBe('OVERDUE_ENTRIES');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.answer).toContain('vencida');
  });

  it('should detect BALANCE intent for "saldo"', async () => {
    bankAccountsRepository.items.push({
      id: { toString: () => 'acc-1' } as never,
      tenantId: 'tenant-1',
      name: 'Conta Corrente Itaú',
      bankCode: '341',
      bankName: 'Itaú',
      agency: '1234',
      accountNumber: '56789-0',
      accountType: 'CHECKING',
      currentBalance: 15000,
      isActive: true,
      isDefault: true,
      color: '#8B5CF6',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'qual meu saldo atual?',
    });

    expect(result.intent).toBe('BALANCE');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.answer).toContain('Saldo total');
    expect(result.answer).toContain('Itaú');
  });

  it('should detect FORECAST intent for "previsão"', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'previsão de caixa para os próximos dias',
    });

    expect(result.intent).toBe('FORECAST');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.answer).toContain('Previsão');
  });

  it('should detect MONTHLY_SUMMARY intent for "resumo"', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'me dá um resumo financeiro',
    });

    expect(result.intent).toBe('MONTHLY_SUMMARY');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.answer).toContain('Resumo financeiro');
  });

  it('should detect UPCOMING_PAYMENTS intent', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'o que vence essa semana?',
    });

    expect(result.intent).toBe('UPCOMING_PAYMENTS');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should return UNKNOWN for unrecognized queries', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'qual a cor do céu?',
    });

    expect(result.intent).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
    expect(result.answer).toContain('não consegui entender');
  });

  it('should handle no overdue entries gracefully', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'contas vencidas',
    });

    expect(result.intent).toBe('OVERDUE_ENTRIES');
    expect(result.answer).toContain('Parabéns');
  });

  it('should detect SUPPLIER_SUMMARY intent', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'fornecedor Empresa ABC',
    });

    expect(result.intent).toBe('SUPPLIER_SUMMARY');
  });

  it('should detect CUSTOMER_SUMMARY intent', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'cliente João Silva',
    });

    expect(result.intent).toBe('CUSTOMER_SUMMARY');
  });
});
