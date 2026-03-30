import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { CreateEmployeeUseCase } from '@/use-cases/hr/employees/create-employee';
import { ReactivateEmployeeUseCase } from '@/use-cases/hr/employees/reactivate-employee';
import { SuspendEmployeeUseCase } from '@/use-cases/hr/employees/suspend-employee';
import { UpdateEmployeeUseCase } from '@/use-cases/hr/employees/update-employee';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let createEmployee: CreateEmployeeUseCase;
let updateEmployee: UpdateEmployeeUseCase;
let suspendEmployee: SuspendEmployeeUseCase;
let reactivateEmployee: ReactivateEmployeeUseCase;

const tenantId = new UniqueEntityID().toString();

describe('[Integration] Employee Lifecycle', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    createEmployee = new CreateEmployeeUseCase(employeesRepository);
    updateEmployee = new UpdateEmployeeUseCase(employeesRepository);
    suspendEmployee = new SuspendEmployeeUseCase(employeesRepository);
    reactivateEmployee = new ReactivateEmployeeUseCase(employeesRepository);
  });

  it('should complete the full lifecycle: create → update → suspend → reactivate', async () => {
    // Step 1: Create employee
    const { employee: createdEmployee } = await createEmployee.execute({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Carlos Eduardo Silva',
      cpf: '529.982.247-25',
      hireDate: new Date('2024-01-15'),
      baseSalary: 4500,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    expect(createdEmployee.status.isActive()).toBe(true);
    expect(createdEmployee.fullName).toBe('Carlos Eduardo Silva');

    // Step 2: Update employee information
    const { employee: updatedEmployee } = await updateEmployee.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
      email: 'carlos.silva@company.com',
      baseSalary: 5000,
      phone: '(11) 99999-0001',
    });

    expect(updatedEmployee.email).toBe('carlos.silva@company.com');
    expect(updatedEmployee.baseSalary).toBe(5000);
    expect(updatedEmployee.status.isActive()).toBe(true);

    // Step 3: Suspend the employee
    const { employee: suspendedEmployee } = await suspendEmployee.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
      reason: 'Investigação disciplinar em andamento',
    });

    expect(suspendedEmployee.status.isSuspended()).toBe(true);

    // Step 4: Reactivate the employee
    const { employee: reactivatedEmployee } = await reactivateEmployee.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
    });

    expect(reactivatedEmployee.status.isActive()).toBe(true);
  });

  it('should not allow reactivating an active employee', async () => {
    const { employee: activeEmployee } = await createEmployee.execute({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Ana Paula Santos',
      cpf: '123.456.789-09',
      hireDate: new Date('2024-03-01'),
      baseSalary: 3500,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      reactivateEmployee.execute({
        tenantId,
        employeeId: activeEmployee.id.toString(),
      }),
    ).rejects.toThrow(
      'Apenas funcionários suspensos ou em licença podem ser reativados',
    );
  });

  it('should not allow suspending a non-active employee', async () => {
    const { employee } = await createEmployee.execute({
      tenantId,
      registrationNumber: 'EMP003',
      fullName: 'Roberto Almeida',
      cpf: '987.654.321-00',
      hireDate: new Date('2024-02-01'),
      baseSalary: 6000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Suspend first
    await suspendEmployee.execute({
      tenantId,
      employeeId: employee.id.toString(),
      reason: 'Motivo disciplinar',
    });

    // Try to suspend again
    await expect(
      suspendEmployee.execute({
        tenantId,
        employeeId: employee.id.toString(),
        reason: 'Segunda suspensão',
      }),
    ).rejects.toThrow('Apenas funcionários ativos podem ser suspensos');
  });

  it('should preserve updated data after status transitions', async () => {
    const { employee } = await createEmployee.execute({
      tenantId,
      registrationNumber: 'EMP004',
      fullName: 'Mariana Costa',
      cpf: '390.533.447-05',
      hireDate: new Date('2023-06-01'),
      baseSalary: 7000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Update personal info
    await updateEmployee.execute({
      tenantId,
      employeeId: employee.id.toString(),
      email: 'mariana.costa@company.com',
      city: 'São Paulo',
      state: 'SP',
    });

    // Suspend
    await suspendEmployee.execute({
      tenantId,
      employeeId: employee.id.toString(),
      reason: 'Licença disciplinar',
    });

    // Reactivate
    const { employee: reactivated } = await reactivateEmployee.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    // Check that personal data is preserved through status transitions
    expect(reactivated.email).toBe('mariana.costa@company.com');
    expect(reactivated.baseSalary).toBe(7000);
    expect(reactivated.fullName).toBe('Mariana Costa');
  });

  it('should not allow duplicate CPF across the lifecycle', async () => {
    await createEmployee.execute({
      tenantId,
      registrationNumber: 'EMP005',
      fullName: 'Pedro Henrique',
      cpf: '453.178.287-91',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      createEmployee.execute({
        tenantId,
        registrationNumber: 'EMP006',
        fullName: 'Outro Funcionário',
        cpf: '453.178.287-91',
        hireDate: new Date('2024-06-01'),
        baseSalary: 4000,
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('Employee with this CPF already exists');
  });
});
