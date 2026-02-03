import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApprovePayrollUseCase } from './approve-payroll';

let payrollsRepository: InMemoryPayrollsRepository;
let sut: ApprovePayrollUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Approve Payroll Use Case', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    sut = new ApprovePayrollUseCase(payrollsRepository);
  });

  it('should approve a calculated payroll', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    // Simulate calculation
    payroll.startProcessing(new UniqueEntityID());
    payroll.finishCalculation(5000, 1000);
    await payrollsRepository.save(payroll);

    const approvedBy = new UniqueEntityID();
    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      approvedBy: approvedBy.toString(),
    });

    expect(result.payroll.status.isApproved()).toBe(true);
    expect(result.payroll.approvedBy).toBeDefined();
    expect(result.payroll.approvedAt).toBeDefined();
  });

  it('should throw error if payroll not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        payrollId: new UniqueEntityID().toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Folha de pagamento não encontrada');
  });

  it('should throw error if payroll is not calculated', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    await expect(
      sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Apenas folhas calculadas podem ser aprovadas');
  });

  it('should throw error if payroll is already approved', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
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
        tenantId,
        payrollId: payroll.id.toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Apenas folhas calculadas podem ser aprovadas');
  });
});
