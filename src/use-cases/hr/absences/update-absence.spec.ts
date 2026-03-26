import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestSickLeaveUseCase } from './request-sick-leave';
import { UpdateAbsenceUseCase } from './update-absence';

let absencesRepository: InMemoryAbsencesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let requestSickLeaveUseCase: RequestSickLeaveUseCase;
let sut: UpdateAbsenceUseCase;
let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Update Absence Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    requestSickLeaveUseCase = new RequestSickLeaveUseCase(
      absencesRepository,
      employeesRepository,
    );
    sut = new UpdateAbsenceUseCase(absencesRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should update absence reason successfully', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    const result = await sut.execute({
      tenantId,
      absenceId: createdAbsence.id.toString(),
      reason: 'Updated reason for sick leave',
    });

    expect(result.absence.reason).toBe('Updated reason for sick leave');
    expect(result.absence.startDate).toEqual(startDate);
  });

  it('should update absence dates successfully', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    const newStartDate = new Date('2026-04-05');
    const newEndDate = new Date('2026-04-08');

    const result = await sut.execute({
      tenantId,
      absenceId: createdAbsence.id.toString(),
      startDate: newStartDate,
      endDate: newEndDate,
    });

    expect(result.absence.startDate).toEqual(newStartDate);
    expect(result.absence.endDate).toEqual(newEndDate);
    expect(result.absence.totalDays).toBe(4);
  });

  it('should update absence notes successfully', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    const result = await sut.execute({
      tenantId,
      absenceId: createdAbsence.id.toString(),
      notes: 'Updated notes',
    });

    expect(result.absence.notes).toBe('Updated notes');
  });

  it('should update multiple fields at once', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    const newStartDate = new Date('2026-04-10');
    const newEndDate = new Date('2026-04-12');

    const result = await sut.execute({
      tenantId,
      absenceId: createdAbsence.id.toString(),
      startDate: newStartDate,
      endDate: newEndDate,
      reason: 'Updated reason',
      notes: 'Updated notes',
    });

    expect(result.absence.startDate).toEqual(newStartDate);
    expect(result.absence.endDate).toEqual(newEndDate);
    expect(result.absence.reason).toBe('Updated reason');
    expect(result.absence.notes).toBe('Updated notes');
  });

  it('should throw error if absence not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        absenceId: new UniqueEntityID().toString(),
        reason: 'Updated reason',
      }),
    ).rejects.toThrow('Ausência não encontrada');
  });

  it('should throw error if absence is already approved', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    // Approve the absence
    createdAbsence.approve(new UniqueEntityID());
    await absencesRepository.save(createdAbsence);

    await expect(
      sut.execute({
        tenantId,
        absenceId: createdAbsence.id.toString(),
        reason: 'Updated reason',
      }),
    ).rejects.toThrow('Somente ausências pendentes podem ser editadas');
  });

  it('should throw error if absence is cancelled', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    // Cancel the absence
    createdAbsence.cancel();
    await absencesRepository.save(createdAbsence);

    await expect(
      sut.execute({
        tenantId,
        absenceId: createdAbsence.id.toString(),
        reason: 'Updated reason',
      }),
    ).rejects.toThrow('Somente ausências pendentes podem ser editadas');
  });

  it('should throw error if end date is before start date', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    await expect(
      sut.execute({
        tenantId,
        absenceId: createdAbsence.id.toString(),
        startDate: new Date('2026-04-10'),
        endDate: new Date('2026-04-05'),
      }),
    ).rejects.toThrow('A data de término deve ser posterior à data de início');
  });

  it('should trim reason and notes on update', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-03');

    const { absence: createdAbsence } = await requestSickLeaveUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta',
    });

    const result = await sut.execute({
      tenantId,
      absenceId: createdAbsence.id.toString(),
      reason: '  Trimmed Reason  ',
      notes: '  Trimmed Notes  ',
    });

    expect(result.absence.reason).toBe('Trimmed Reason');
    expect(result.absence.notes).toBe('Trimmed Notes');
  });
});
