import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { InMemoryConsortiumPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-consortium-payments-repository';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateConsortiumUseCase } from './create-consortium';

let consortiaRepository: InMemoryConsortiaRepository;
let paymentsRepository: InMemoryConsortiumPaymentsRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let sut: CreateConsortiumUseCase;

let seededBankAccountId: string;
let seededCostCenterId: string;

describe('CreateConsortiumUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    paymentsRepository = new InMemoryConsortiumPaymentsRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    sut = new CreateConsortiumUseCase(
      consortiaRepository,
      paymentsRepository,
      bankAccountsRepository,
      costCentersRepository,
    );

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });
    seededBankAccountId = bankAccount.id.toString();

    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });
    seededCostCenterId = costCenter.id.toString();
  });

  it('should create a consortium with auto-generated payments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Consorcio Imobiliario',
      administrator: 'Porto Seguro Consorcio',
      creditValue: 200000,
      monthlyPayment: 1500,
      totalInstallments: 180,
      startDate: new Date('2026-01-01'),
    });

    expect(result.consortium).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Consorcio Imobiliario',
        administrator: 'Porto Seguro Consorcio',
        status: 'ACTIVE',
        creditValue: 200000,
        monthlyPayment: 1500,
        totalInstallments: 180,
        paidInstallments: 0,
        isContemplated: false,
      }),
    );

    expect(result.payments).toHaveLength(180);
    expect(result.payments[0].installmentNumber).toBe(1);
    expect(result.payments[0].expectedAmount).toBe(1500);
    expect(result.payments[179].installmentNumber).toBe(180);
  });

  it('should create with optional fields', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Consorcio Auto',
      administrator: 'Embracon',
      creditValue: 80000,
      monthlyPayment: 800,
      totalInstallments: 60,
      startDate: new Date('2026-01-01'),
      paymentDay: 15,
      groupNumber: 'GRP-123',
      quotaNumber: 'Q-456',
      contractNumber: 'CNT-789',
      notes: 'Consorcio de veiculo',
    });

    expect(result.consortium.groupNumber).toBe('GRP-123');
    expect(result.consortium.quotaNumber).toBe('Q-456');
    expect(result.consortium.contractNumber).toBe('CNT-789');
    expect(result.consortium.notes).toBe('Consorcio de veiculo');
  });

  it('should not create with non-existent bank account', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'non-existent-id',
        costCenterId: seededCostCenterId,
        name: 'Consorcio invalido',
        administrator: 'Admin',
        creditValue: 100000,
        monthlyPayment: 1000,
        totalInstallments: 120,
        startDate: new Date('2026-01-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with non-existent cost center', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: seededBankAccountId,
        costCenterId: 'non-existent-id',
        name: 'Consorcio invalido',
        administrator: 'Admin',
        creditValue: 100000,
        monthlyPayment: 1000,
        totalInstallments: 120,
        startDate: new Date('2026-01-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
