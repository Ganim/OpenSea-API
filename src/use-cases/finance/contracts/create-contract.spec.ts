import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateContractUseCase } from './create-contract';

let contractsRepository: InMemoryContractsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: CreateContractUseCase;

describe('CreateContractUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryContractsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CreateContractUseCase(
      contractsRepository,
      financeEntriesRepository,
    );
  });

  it('should create a contract with ACTIVE status', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      title: 'Contrato de Limpeza',
      companyName: 'Empresa ABC',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      categoryId: 'cat-1',
    });

    expect(result.contract).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: 'Contrato de Limpeza',
        companyName: 'Empresa ABC',
        status: 'ACTIVE',
        totalValue: 12000,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 1000,
        autoRenew: false,
        alertDaysBefore: 30,
      }),
    );
  });

  it('should generate payable entries when categoryId is provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      title: 'Contrato Mensal',
      companyName: 'Fornecedor X',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      categoryId: 'cat-1',
    });

    // 11 payments: Feb 1 through Dec 1 (first payment is 1 period after startDate)
    expect(result.entriesGenerated).toBe(11);
    expect(financeEntriesRepository.items).toHaveLength(11);
    expect(financeEntriesRepository.items[0].type).toBe('PAYABLE');
    expect(financeEntriesRepository.items[0].contractId).toBe(
      result.contract.id,
    );
  });

  it('should not generate entries when categoryId is not provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      title: 'Contrato Rascunho',
      companyName: 'Empresa Y',
      totalValue: 5000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
    });

    expect(result.entriesGenerated).toBe(0);
    expect(financeEntriesRepository.items).toHaveLength(0);
  });

  it('should reject when endDate is before startDate', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        title: 'Contrato Invalido',
        companyName: 'Empresa Z',
        totalValue: 1000,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 100,
        startDate: new Date('2026-12-31'),
        endDate: new Date('2026-01-01'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject when title is empty', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        title: '   ',
        companyName: 'Empresa A',
        totalValue: 1000,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 100,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject when totalValue is not positive', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        title: 'Contrato',
        companyName: 'Empresa A',
        totalValue: 0,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 100,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject when companyName is empty', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        title: 'Contrato',
        companyName: '',
        totalValue: 1000,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 100,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should store optional fields (autoRenew, alertDaysBefore, etc.)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      title: 'Contrato Completo',
      companyName: 'Empresa Full',
      companyId: 'company-1',
      contactName: 'Joao Silva',
      contactEmail: 'joao@empresa.com',
      totalValue: 24000,
      paymentFrequency: 'QUARTERLY',
      paymentAmount: 6000,
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      bankAccountId: 'ba-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      autoRenew: true,
      renewalPeriodMonths: 12,
      alertDaysBefore: 60,
      notes: 'Contrato importante',
    });

    expect(result.contract).toEqual(
      expect.objectContaining({
        companyId: 'company-1',
        contactName: 'Joao Silva',
        contactEmail: 'joao@empresa.com',
        autoRenew: true,
        renewalPeriodMonths: 12,
        alertDaysBefore: 60,
        notes: 'Contrato importante',
      }),
    );
  });
});
