import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PayrollToFinanceUseCase } from './payroll-to-finance';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: PayrollToFinanceUseCase;

const tenantId = 'tenant-1';

async function createApprovedPayroll() {
  const payroll = await payrollsRepository.create({
    tenantId,
    referenceMonth: 1,
    referenceYear: 2026,
  });

  // Process and approve
  payroll.startProcessing(new UniqueEntityID());
  payroll.finishCalculation(5000, 1000);
  payroll.approve(new UniqueEntityID());
  await payrollsRepository.save(payroll);

  return payroll;
}

let empCounter = 0;
async function createEmployee(name: string) {
  empCounter++;
  return employeesRepository.create({
    tenantId,
    registrationNumber: `REG-${empCounter}`,
    fullName: name,
    cpf: CPF.create('529.982.247-25'),
    country: 'BR',
    hireDate: new Date(2025, 0, 1),
    status: EmployeeStatus.ACTIVE(),
    baseSalary: 3000,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
  });
}

async function seedCategories() {
  await categoriesRepository.create({
    tenantId,
    name: 'Salários e Ordenados',
    slug: 'salarios-e-ordenados',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Encargos Sociais - INSS',
    slug: 'encargos-sociais-inss',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Encargos Sociais - FGTS',
    slug: 'encargos-sociais-fgts',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Impostos - IRRF',
    slug: 'impostos-irrf',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Benefícios - Vale Transporte',
    slug: 'beneficios-vale-transporte',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Benefícios - Vale Refeição',
    slug: 'beneficios-vale-refeicao',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Benefícios - Plano de Saúde',
    slug: 'beneficios-plano-saude',
    type: 'EXPENSE',
  });
  await categoriesRepository.create({
    tenantId,
    name: 'Gratificações e Bônus',
    slug: 'gratificacoes-e-bonus',
    type: 'EXPENSE',
  });
}

describe('PayrollToFinanceUseCase', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new PayrollToFinanceUseCase(
      payrollsRepository,
      payrollItemsRepository,
      employeesRepository,
      entriesRepository,
      categoriesRepository,
    );

    await seedCategories();
  });

  it('should create finance entries from approved payroll', async () => {
    const payroll = await createApprovedPayroll();
    const employee = await createEmployee('Maria Silva');

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: 5000,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'INSS',
      description: 'INSS',
      amount: 550,
      isDeduction: true,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
    });

    // 1 net salary + 1 INSS aggregate = 2 entries
    expect(result.entriesCreated).toBe(2);
    expect(result.totalAmount).toBe(4450 + 550); // net salary + INSS

    // Verify entries created
    expect(entriesRepository.items).toHaveLength(2);
    const salaryEntry = entriesRepository.items.find((e) =>
      e.description.includes('Salário líquido'),
    );
    expect(salaryEntry).toBeDefined();
    expect(salaryEntry!.expectedAmount).toBe(4450); // 5000 - 550
    expect(salaryEntry!.type).toBe('PAYABLE');
    expect(salaryEntry!.supplierName).toBe('Maria Silva');
  });

  it('should create entries for multiple employees', async () => {
    const payroll = await createApprovedPayroll();
    const emp1 = await createEmployee('João Santos');
    const emp2 = await createEmployee('Ana Oliveira');

    // Employee 1: salary only
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp1.id,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: 3000,
    });

    // Employee 2: salary + FGTS
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp2.id,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: 4000,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp2.id,
      type: 'FGTS',
      description: 'FGTS',
      amount: 320,
      isDeduction: true,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
    });

    // 2 net salary entries + 1 FGTS aggregate = 3
    expect(result.entriesCreated).toBe(3);
    expect(entriesRepository.items).toHaveLength(3);
  });

  it('should throw if payroll is not approved', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2026,
    });

    await expect(
      sut.execute({ tenantId, payrollId: payroll.id.toString() }),
    ).rejects.toThrow('precisa estar aprovada');
  });

  it('should throw if payroll not found', async () => {
    await expect(
      sut.execute({ tenantId, payrollId: new UniqueEntityID().toString() }),
    ).rejects.toThrow('não encontrada');
  });

  it('should throw if entries already imported (duplicate prevention)', async () => {
    const payroll = await createApprovedPayroll();
    const employee = await createEmployee('Pedro Lima');

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: 3000,
    });

    // First import succeeds
    await sut.execute({ tenantId, payrollId: payroll.id.toString() });

    // Second import should fail
    await expect(
      sut.execute({ tenantId, payrollId: payroll.id.toString() }),
    ).rejects.toThrow('já foram gerados');
  });

  it('should throw if payroll has no items', async () => {
    const payroll = await createApprovedPayroll();

    await expect(
      sut.execute({ tenantId, payrollId: payroll.id.toString() }),
    ).rejects.toThrow('não possui itens');
  });

  it('should create aggregate entries for taxes', async () => {
    const payroll = await createApprovedPayroll();
    const emp1 = await createEmployee('Func 1');
    const emp2 = await createEmployee('Func 2');

    // Both employees have salary and INSS
    for (const emp of [emp1, emp2]) {
      await payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId: emp.id,
        type: 'BASE_SALARY',
        description: 'Salário',
        amount: 3000,
      });
      await payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId: emp.id,
        type: 'INSS',
        description: 'INSS',
        amount: 330,
        isDeduction: true,
      });
      await payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId: emp.id,
        type: 'IRRF',
        description: 'IRRF',
        amount: 150,
        isDeduction: true,
      });
    }

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
    });

    // 2 net salary + 1 INSS aggregate + 1 IRRF aggregate = 4
    expect(result.entriesCreated).toBe(4);

    // INSS aggregate should be 660 (330 * 2)
    const inssEntry = entriesRepository.items.find((e) =>
      e.description.includes('INSS'),
    );
    expect(inssEntry).toBeDefined();
    expect(inssEntry!.expectedAmount).toBe(660);

    // IRRF aggregate should be 300 (150 * 2)
    const irrfEntry = entriesRepository.items.find((e) =>
      e.description.includes('IRRF'),
    );
    expect(irrfEntry).toBeDefined();
    expect(irrfEntry!.expectedAmount).toBe(300);
  });

  it('should create aggregate entries for benefits', async () => {
    const payroll = await createApprovedPayroll();
    const employee = await createEmployee('Carlos Souza');

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 4000,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'TRANSPORT_VOUCHER',
      description: 'VT',
      amount: 200,
      isDeduction: true,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'MEAL_VOUCHER',
      description: 'VR',
      amount: 500,
      isDeduction: true,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
    });

    // 1 net salary + 1 VT + 1 VR = 3
    expect(result.entriesCreated).toBe(3);

    const vtEntry = entriesRepository.items.find((e) =>
      e.description.includes('Vale Transporte'),
    );
    expect(vtEntry).toBeDefined();
    expect(vtEntry!.expectedAmount).toBe(200);

    const vrEntry = entriesRepository.items.find((e) =>
      e.description.includes('Vale Refeição'),
    );
    expect(vrEntry).toBeDefined();
    expect(vrEntry!.expectedAmount).toBe(500);
  });

  it('should set correct dates and tags', async () => {
    const payroll = await createApprovedPayroll();
    const employee = await createEmployee('Test Employee');

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 3000,
    });

    await sut.execute({ tenantId, payrollId: payroll.id.toString() });

    const entry = entriesRepository.items[0];
    // Due date should be last day of January 2026
    expect(entry.dueDate.getFullYear()).toBe(2026);
    expect(entry.dueDate.getMonth()).toBe(0); // January (0-indexed)
    expect(entry.dueDate.getDate()).toBe(31); // Jan has 31 days

    // Competence should be Jan 1 2026
    expect(entry.competenceDate!.getFullYear()).toBe(2026);
    expect(entry.competenceDate!.getMonth()).toBe(0);

    // Tags
    expect(entry.tags).toContain(`FOLHA-${payroll.id.toString()}`);
    expect(entry.tags).toContain(`EMP-${employee.id.toString()}`);
  });
});
