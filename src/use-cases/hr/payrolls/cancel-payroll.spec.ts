import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelPayrollUseCase } from './cancel-payroll';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let sut: CancelPayrollUseCase;

describe('Cancel Payroll Use Case', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    sut = new CancelPayrollUseCase(payrollsRepository, payrollItemsRepository);
  });

  it('should cancel a draft payroll', async () => {
    const payroll = await payrollsRepository.create({
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      payrollId: payroll.id.toString(),
    });

    expect(result.payroll.status.isCancelled()).toBe(true);
  });

  it('should cancel a calculated payroll', async () => {
    const payroll = await payrollsRepository.create({
      referenceMonth: 6,
      referenceYear: 2024,
    });

    // Simulate calculation
    payroll.startProcessing(new UniqueEntityID());
    payroll.finishCalculation(5000, 1000);
    await payrollsRepository.save(payroll);

    const result = await sut.execute({
      payrollId: payroll.id.toString(),
    });

    expect(result.payroll.status.isCancelled()).toBe(true);
  });

  it('should throw error if payroll not found', async () => {
    await expect(
      sut.execute({
        payrollId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Folha de pagamento não encontrada');
  });

  it('should throw error if payroll is already approved', async () => {
    const payroll = await payrollsRepository.create({
      referenceMonth: 6,
      referenceYear: 2024,
    });

    // Simulate calculation and approval
    payroll.startProcessing(new UniqueEntityID());
    payroll.finishCalculation(5000, 1000);
    payroll.approve(new UniqueEntityID());
    await payrollsRepository.save(payroll);

    await expect(
      sut.execute({
        payrollId: payroll.id.toString(),
      }),
    ).rejects.toThrow();
  });

  it('should throw error if payroll is already paid', async () => {
    const payroll = await payrollsRepository.create({
      referenceMonth: 6,
      referenceYear: 2024,
    });

    // Simulate full lifecycle
    payroll.startProcessing(new UniqueEntityID());
    payroll.finishCalculation(5000, 1000);
    payroll.approve(new UniqueEntityID());
    payroll.markAsPaid(new UniqueEntityID());
    await payrollsRepository.save(payroll);

    await expect(
      sut.execute({
        payrollId: payroll.id.toString(),
      }),
    ).rejects.toThrow('Folhas já pagas não podem ser canceladas');
  });
});
