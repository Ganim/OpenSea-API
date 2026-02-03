import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPayrollsUseCase } from './list-payrolls';

let payrollsRepository: InMemoryPayrollsRepository;
let sut: ListPayrollsUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Payrolls Use Case', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    sut = new ListPayrollsUseCase(payrollsRepository);
  });

  it('should list all payrolls', async () => {
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 2,
      referenceYear: 2024,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    const result = await sut.execute({ tenantId });

    expect(result.payrolls).toHaveLength(3);
  });

  it('should filter payrolls by year', async () => {
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2023,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 2,
      referenceYear: 2024,
    });

    const result = await sut.execute({ tenantId, referenceYear: 2024 });

    expect(result.payrolls).toHaveLength(2);
    result.payrolls.forEach((payroll) => {
      expect(payroll.referenceYear).toBe(2024);
    });
  });

  it('should filter payrolls by month', async () => {
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2023,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 7,
      referenceYear: 2024,
    });

    const result = await sut.execute({ tenantId, referenceMonth: 6 });

    expect(result.payrolls).toHaveLength(2);
    result.payrolls.forEach((payroll) => {
      expect(payroll.referenceMonth).toBe(6);
    });
  });

  it('should filter payrolls by status', async () => {
    const payroll1 = await payrollsRepository.create({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 2,
      referenceYear: 2024,
    });

    // Aprovar o primeiro payroll
    payroll1.startProcessing(new UniqueEntityID());
    payroll1.finishCalculation(5000, 1000);
    payroll1.approve(new UniqueEntityID());
    await payrollsRepository.save(payroll1);

    const result = await sut.execute({ tenantId, status: 'APPROVED' });

    expect(result.payrolls).toHaveLength(1);
    expect(result.payrolls[0].status.isApproved()).toBe(true);
  });

  it('should return empty array when no payrolls exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.payrolls).toHaveLength(0);
  });
});
