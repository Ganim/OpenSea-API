import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { NoticeType, TerminationType } from '@/entities/hr/termination';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { CalculateTerminationPaymentUseCase } from '@/use-cases/hr/terminations/calculate-termination-payment';
import { CreateTerminationUseCase } from '@/use-cases/hr/terminations/create-termination';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let terminationsRepository: InMemoryTerminationsRepository;
let createTermination: CreateTerminationUseCase;
let calculateTerminationPayment: CalculateTerminationPaymentUseCase;

let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('[Integration] Termination Flow', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    terminationsRepository = new InMemoryTerminationsRepository();

    createTermination = new CreateTerminationUseCase(
      terminationsRepository,
      employeesRepository,
    );
    calculateTerminationPayment = new CalculateTerminationPaymentUseCase(
      terminationsRepository,
      employeesRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Ricardo Mendes',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2020-03-15'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 6000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create termination → calculate TRCT payment', async () => {
    const terminationDate = new Date(2024, 5, 15); // June 15, 2024 (local time)
    const lastWorkDay = new Date(2024, 5, 15);

    // Create termination
    const { termination } = await createTermination.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay,
      noticeType: NoticeType.INDENIZADO,
    });

    expect(termination.isPending()).toBe(true);
    expect(termination.type).toBe(TerminationType.SEM_JUSTA_CAUSA);

    // Notice days: 30 + (3 × complete years of service)
    expect(termination.noticeDays).toBeGreaterThanOrEqual(30);

    // Calculate payment (TRCT)
    const { breakdown } = await calculateTerminationPayment.execute({
      tenantId,
      terminationId: termination.id.toString(),
      totalFgtsBalance: 15000,
    });

    // Saldo de salario: (6000/30) * day-of-month
    const expectedSaldo =
      Math.round((6000 / 30) * terminationDate.getDate() * 100) / 100;
    expect(breakdown.saldoSalario).toBe(expectedSaldo);

    // Aviso indenizado for SEM_JUSTA_CAUSA should be positive
    expect(breakdown.avisoIndenizado).toBeGreaterThan(0);

    // FGTS fine for SEM_JUSTA_CAUSA: 40%
    expect(breakdown.multaFgts).toBe(6000); // 15000 * 0.40

    // Total bruto should include all items
    expect(breakdown.totalBruto).toBeGreaterThan(0);
    expect(breakdown.totalLiquido).toBe(
      breakdown.totalBruto - breakdown.totalDescontos,
    );

    // Employee should be terminated
    const terminatedEmployee = await employeesRepository.findById(
      testEmployee.id,
      tenantId,
    );
    expect(terminatedEmployee?.status.value).toBe('TERMINATED');
  });

  it('should calculate reduced FGTS fine for ACORDO_MUTUO (20%)', async () => {
    const { termination } = await createTermination.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      type: TerminationType.ACORDO_MUTUO,
      terminationDate: new Date(2024, 5, 15),
      lastWorkDay: new Date(2024, 5, 15),
      noticeType: NoticeType.INDENIZADO,
    });

    const { breakdown } = await calculateTerminationPayment.execute({
      tenantId,
      terminationId: termination.id.toString(),
      totalFgtsBalance: 15000,
    });

    // Acordo mutuo: 20% FGTS fine
    expect(breakdown.multaFgts).toBe(3000); // 15000 * 0.20

    // Aviso indenizado for acordo mutuo: 50% of normal
    expect(breakdown.avisoIndenizado).toBeGreaterThan(0);
  });

  it('should not grant 13th proportional or proportional vacation for JUSTA_CAUSA', async () => {
    const { termination } = await createTermination.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      type: TerminationType.JUSTA_CAUSA,
      terminationDate: new Date(2024, 5, 15),
      lastWorkDay: new Date(2024, 5, 15),
      noticeType: NoticeType.DISPENSADO,
    });

    const { breakdown } = await calculateTerminationPayment.execute({
      tenantId,
      terminationId: termination.id.toString(),
    });

    // Justa causa: no 13th proportional
    expect(breakdown.decimoTerceiroProp).toBe(0);

    // Justa causa: no proportional vacation
    expect(breakdown.feriasProporcional).toBe(0);
    expect(breakdown.feriasProporcionalTerco).toBe(0);

    // Justa causa: no FGTS fine
    expect(breakdown.multaFgts).toBe(0);

    // Justa causa: no aviso indenizado
    expect(breakdown.avisoIndenizado).toBe(0);
  });

  it('should not create termination for already terminated employee', async () => {
    // First termination
    await createTermination.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      type: TerminationType.PEDIDO_DEMISSAO,
      terminationDate: new Date(2024, 5, 15),
      lastWorkDay: new Date(2024, 5, 15),
      noticeType: NoticeType.TRABALHADO,
    });

    // Try second termination
    await expect(
      createTermination.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date(2024, 6, 1),
        lastWorkDay: new Date(2024, 6, 1),
        noticeType: NoticeType.INDENIZADO,
      }),
    ).rejects.toThrow(); // Either "already terminated" or "already has termination"
  });

  it('should set payment deadline to 10 days after termination date', async () => {
    const terminationDate = new Date(2024, 7, 20);

    const { termination } = await createTermination.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate,
      lastWorkDay: terminationDate,
      noticeType: NoticeType.INDENIZADO,
    });

    const expectedDeadline = new Date(terminationDate);
    expectedDeadline.setDate(expectedDeadline.getDate() + 10);

    expect(termination.paymentDeadline.getTime()).toBe(
      expectedDeadline.getTime(),
    );
  });
});
