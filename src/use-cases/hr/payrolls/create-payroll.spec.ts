import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePayrollUseCase } from './create-payroll';

let payrollsRepository: InMemoryPayrollsRepository;
let sut: CreatePayrollUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Payroll Use Case', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    sut = new CreatePayrollUseCase(payrollsRepository);
  });

  it('should create a new payroll successfully', async () => {
    const result = await sut.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    expect(result.payroll).toBeDefined();
    expect(result.payroll.referenceMonth).toBe(6);
    expect(result.payroll.referenceYear).toBe(2024);
    expect(result.payroll.status.isDraft()).toBe(true);
    expect(result.payroll.totalGross).toBe(0);
    expect(result.payroll.totalDeductions).toBe(0);
    expect(result.payroll.totalNet).toBe(0);
  });

  it('should throw error if payroll already exists for the period', async () => {
    await sut.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    await expect(
      sut.execute({
        tenantId,
        referenceMonth: 6,
        referenceYear: 2024,
      }),
    ).rejects.toThrow('Já existe uma folha de pagamento para 6/2024');
  });

  it('should create payrolls for different periods', async () => {
    const result1 = await sut.execute({
      tenantId,
      referenceMonth: 5,
      referenceYear: 2024,
    });

    const result2 = await sut.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    expect(result1.payroll.referenceMonth).toBe(5);
    expect(result2.payroll.referenceMonth).toBe(6);
    expect(payrollsRepository.items.length).toBe(2);
  });

  it('should create payrolls for different years', async () => {
    const result1 = await sut.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2023,
    });

    const result2 = await sut.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    expect(result1.payroll.referenceYear).toBe(2023);
    expect(result2.payroll.referenceYear).toBe(2024);
  });
});
