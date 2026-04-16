import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScheduleOneOnOneUseCase } from './schedule-one-on-one';

let oneOnOneMeetingsRepository: InMemoryOneOnOneMeetingsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ScheduleOneOnOneUseCase;
let manager: Employee;
let report: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Schedule One-on-One Use Case', () => {
  beforeEach(async () => {
    oneOnOneMeetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ScheduleOneOnOneUseCase(
      oneOnOneMeetingsRepository,
      employeesRepository,
    );

    manager = await employeesRepository.create({
      tenantId,
      registrationNumber: 'MGR-001',
      fullName: 'Sofia Mendes Almeida',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2020-01-01'),
      status: EmployeeStatus.ACTIVE(),
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    report = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-002',
      fullName: 'Pedro Henrique Lopes',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2023-04-10'),
      status: EmployeeStatus.ACTIVE(),
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should schedule a meeting with default duration', async () => {
    const scheduledAt = new Date('2025-08-12T14:00:00Z');

    const { meeting } = await sut.execute({
      tenantId,
      managerId: manager.id.toString(),
      reportId: report.id.toString(),
      scheduledAt,
    });

    expect(meeting.status).toBe('SCHEDULED');
    expect(meeting.durationMinutes).toBe(30);
    expect(meeting.scheduledAt).toEqual(scheduledAt);
  });

  it('should accept custom duration', async () => {
    const { meeting } = await sut.execute({
      tenantId,
      managerId: manager.id.toString(),
      reportId: report.id.toString(),
      scheduledAt: new Date('2025-08-12T14:00:00Z'),
      durationMinutes: 60,
    });

    expect(meeting.durationMinutes).toBe(60);
  });

  it('should reject when manager equals report', async () => {
    await expect(
      sut.execute({
        tenantId,
        managerId: manager.id.toString(),
        reportId: manager.id.toString(),
        scheduledAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject when manager not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        managerId: new UniqueEntityID().toString(),
        reportId: report.id.toString(),
        scheduledAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject when report not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        managerId: manager.id.toString(),
        reportId: new UniqueEntityID().toString(),
        scheduledAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
