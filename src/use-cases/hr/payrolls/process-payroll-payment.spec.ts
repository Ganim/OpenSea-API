import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PayrollStatus } from '@/entities/hr/value-objects';
import { InMemoryBonusesRepository } from '@/repositories/hr/in-memory/in-memory-bonuses-repository';
import { InMemoryDeductionsRepository } from '@/repositories/hr/in-memory/in-memory-deductions-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProcessPayrollPaymentUseCase } from './process-payroll-payment';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let bonusesRepository: InMemoryBonusesRepository;
let deductionsRepository: InMemoryDeductionsRepository;
let sut: ProcessPayrollPaymentUseCase;

const tenantId = new UniqueEntityID().toString();

describe('ProcessPayrollPaymentUseCase', () => {
  beforeEach(() => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    bonusesRepository = new InMemoryBonusesRepository();
    deductionsRepository = new InMemoryDeductionsRepository();
    sut = new ProcessPayrollPaymentUseCase(
      payrollsRepository,
      payrollItemsRepository,
      bonusesRepository,
      deductionsRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existent payroll', async () => {
    await expect(() =>
      sut.execute({ tenantId, payrollId: 'non-existent', paidBy: 'admin' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject payment for a payroll that is not in APPROVED status', async () => {
    // Create a DRAFT payroll (not approved)
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2025,
      totalGross: 10000,
      totalDeductions: 2000,
    });

    await expect(() =>
      sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        paidBy: 'admin-user',
      }),
    ).rejects.toThrow('Apenas folhas aprovadas podem ser pagas');
  });

  it('should reject payment for a CALCULATED payroll (not yet approved)', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 4,
      referenceYear: 2025,
      totalGross: 8000,
      totalDeductions: 1500,
    });

    // Advance to PROCESSING then CALCULATED
    payroll.startProcessing(new UniqueEntityID());
    payroll.finishCalculation(8000, 1500);
    await payrollsRepository.save(payroll);

    await expect(() =>
      sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        paidBy: 'admin-user',
      }),
    ).rejects.toThrow('Apenas folhas aprovadas podem ser pagas');
  });

  it('should successfully process payment for an APPROVED payroll', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 5,
      referenceYear: 2025,
      totalGross: 15000,
      totalDeductions: 3000,
    });

    // Advance through the workflow: DRAFT -> PROCESSING -> CALCULATED -> APPROVED
    payroll.startProcessing(new UniqueEntityID());
    payroll.finishCalculation(15000, 3000);
    payroll.approve(new UniqueEntityID());
    await payrollsRepository.save(payroll);

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      paidBy: 'admin-user',
    });

    expect(result.payroll).toBeDefined();
    expect(result.payroll.status.isPaid()).toBe(true);
    expect(result.payroll.paidAt).toBeDefined();
    expect(result.payroll.paidBy).toBeDefined();
  });
});
