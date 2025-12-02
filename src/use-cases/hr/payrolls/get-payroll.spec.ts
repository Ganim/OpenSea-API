import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPayrollUseCase } from './get-payroll';

let payrollsRepository: InMemoryPayrollsRepository;
let sut: GetPayrollUseCase;

describe('Get Payroll Use Case', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    sut = new GetPayrollUseCase(payrollsRepository);
  });

  it('should get a payroll by id', async () => {
    const createdPayroll = await payrollsRepository.create({
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      payrollId: createdPayroll.id.toString(),
    });

    expect(result.payroll).toBeDefined();
    expect(result.payroll.id.equals(createdPayroll.id)).toBe(true);
    expect(result.payroll.referenceMonth).toBe(6);
    expect(result.payroll.referenceYear).toBe(2024);
  });

  it('should throw error if payroll not found', async () => {
    await expect(
      sut.execute({
        payrollId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Folha de pagamento não encontrada');
  });
});
