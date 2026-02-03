import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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
});
