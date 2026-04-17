import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotifyDocExpiryUseCase } from './notify-doc-expiry';

const tenantId = new UniqueEntityID().toString();
const otherTenantId = new UniqueEntityID().toString();
const FROZEN_NOW = new Date('2026-04-16T12:00:00Z');

let employeesRepository: InMemoryEmployeesRepository;
let medicalExamsRepository: InMemoryMedicalExamsRepository;
let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let notificationsRepository: InMemoryNotificationsRepository;
let createNotificationUseCase: CreateNotificationUseCase;
let sut: NotifyDocExpiryUseCase;

async function createEmployee({
  registrationNumber = 'EMP001',
  cpf = '529.982.247-25',
  userId,
  supervisorId,
  active = true,
  inTenant = tenantId,
}: {
  registrationNumber?: string;
  cpf?: string;
  userId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
  active?: boolean;
  inTenant?: string;
} = {}) {
  return employeesRepository.create({
    tenantId: inTenant,
    registrationNumber,
    fullName: `Employee ${registrationNumber}`,
    cpf: CPF.create(cpf),
    hireDate: new Date('2024-01-01'),
    status: active ? EmployeeStatus.ACTIVE() : EmployeeStatus.TERMINATED(),
    baseSalary: 3000,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
    userId,
    supervisorId,
  });
}

async function createMedicalExam({
  employeeId,
  expirationDate,
  inTenant = tenantId,
}: {
  employeeId: UniqueEntityID;
  expirationDate: Date;
  inTenant?: string;
}) {
  return medicalExamsRepository.create({
    tenantId: inTenant,
    employeeId,
    type: 'PERIODIC',
    examDate: new Date('2025-01-01'),
    expirationDate,
    doctorName: 'Dr. Teste',
    doctorCrm: 'CRM-SP 12345',
    result: 'APT',
  });
}

describe('Notify Doc Expiry Use Case', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
    employeesRepository = new InMemoryEmployeesRepository();
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    notificationsRepository = new InMemoryNotificationsRepository();
    createNotificationUseCase = new CreateNotificationUseCase(
      notificationsRepository,
    );
    sut = new NotifyDocExpiryUseCase(
      employeesRepository,
      medicalExamsRepository,
      trainingEnrollmentsRepository,
      trainingProgramsRepository,
      createNotificationUseCase,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifies the supervisor when a medical exam expires within the lookahead', async () => {
    const supervisorUserId = new UniqueEntityID();
    const supervisor = await createEmployee({
      registrationNumber: 'SUP001',
      cpf: '111.444.777-35',
      userId: supervisorUserId,
    });
    const employee = await createEmployee({
      registrationNumber: 'EMP002',
      cpf: '390.533.447-05',
      supervisorId: supervisor.id,
    });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-05-01T12:00:00Z'),
    });

    const result = await sut.execute({ tenantId });

    expect(result.scannedMedicalExams).toBe(1);
    expect(result.notificationsCreated).toBe(1);
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0].userId.toString()).toBe(
      supervisorUserId.toString(),
    );
    expect(notificationsRepository.items[0].entityType).toBe('MEDICAL_EXAM');
  });

  it('falls back to the employee user when no supervisor is set', async () => {
    const employeeUserId = new UniqueEntityID();
    const employee = await createEmployee({ userId: employeeUserId });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-05-01T12:00:00Z'),
    });

    const result = await sut.execute({ tenantId });

    expect(result.notificationsCreated).toBe(1);
    expect(notificationsRepository.items[0].userId.toString()).toBe(
      employeeUserId.toString(),
    );
  });

  it('skips notification when neither supervisor nor employee have a linked user', async () => {
    const employee = await createEmployee();
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-05-01T12:00:00Z'),
    });

    const result = await sut.execute({ tenantId });

    expect(result.scannedMedicalExams).toBe(1);
    expect(result.notificationsCreated).toBe(0);
    expect(notificationsRepository.items).toHaveLength(0);
  });

  it('is idempotent: re-running the scan does not create duplicate notifications', async () => {
    const employee = await createEmployee({ userId: new UniqueEntityID() });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-05-01T12:00:00Z'),
    });

    const first = await sut.execute({ tenantId });
    const second = await sut.execute({ tenantId });

    expect(first.notificationsCreated).toBe(1);
    expect(second.notificationsCreated).toBe(1); // returns the existing one via dedup
    expect(notificationsRepository.items).toHaveLength(1);
  });

  it('ignores medical exams that have already expired', async () => {
    const employee = await createEmployee({ userId: new UniqueEntityID() });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-04-01T12:00:00Z'), // before FROZEN_NOW
    });

    const result = await sut.execute({ tenantId });

    expect(result.scannedMedicalExams).toBe(0);
    expect(result.notificationsCreated).toBe(0);
  });

  it('ignores medical exams that expire beyond the lookahead window', async () => {
    const employee = await createEmployee({ userId: new UniqueEntityID() });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-06-30T12:00:00Z'), // > 30 days past FROZEN_NOW
    });

    const result = await sut.execute({ tenantId });

    expect(result.scannedMedicalExams).toBe(0);
    expect(result.notificationsCreated).toBe(0);
  });

  it('honors a custom lookaheadDays value', async () => {
    const employee = await createEmployee({ userId: new UniqueEntityID() });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-06-30T12:00:00Z'),
    });

    const result = await sut.execute({ tenantId, lookaheadDays: 90 });

    expect(result.scannedMedicalExams).toBe(1);
    expect(result.notificationsCreated).toBe(1);
  });

  it('does not leak medical exams across tenants', async () => {
    const employee = await createEmployee({
      userId: new UniqueEntityID(),
      inTenant: otherTenantId,
    });
    await createMedicalExam({
      employeeId: employee.id,
      expirationDate: new Date('2026-05-01T12:00:00Z'),
      inTenant: otherTenantId,
    });

    const result = await sut.execute({ tenantId });

    expect(result.scannedMedicalExams).toBe(0);
    expect(result.notificationsCreated).toBe(0);
  });

  it('notifies for completed trainings whose certification expires within the lookahead', async () => {
    const employeeUserId = new UniqueEntityID();
    const employee = await createEmployee({ userId: employeeUserId });

    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'NR-35 Trabalho em Altura',
      description: 'Certificação NR-35',
      category: 'TECHNICAL',
      format: 'IN_PERSON',
      durationHours: 8,
      validityMonths: 12,
    });

    // Completed ~11 months and 20 days before FROZEN_NOW →
    // expiration ~= now + 10 days (inside 30-day window).
    const completedAt = new Date(FROZEN_NOW);
    completedAt.setMonth(completedAt.getMonth() - 12);
    completedAt.setDate(completedAt.getDate() + 10);

    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: program.id,
      employeeId: employee.id,
      status: 'COMPLETED',
    });
    (
      enrollment as unknown as { props: { completedAt: Date | undefined } }
    ).props.completedAt = completedAt;

    const result = await sut.execute({
      tenantId,
      referenceDate: FROZEN_NOW,
    });

    expect(result.scannedTrainings).toBe(1);
    expect(result.notificationsCreated).toBe(1);
    expect(notificationsRepository.items[0].entityType).toBe(
      'TRAINING_ENROLLMENT',
    );
    expect(notificationsRepository.items[0].userId.toString()).toBe(
      employeeUserId.toString(),
    );
  });

  it('ignores completed trainings whose program has no validityMonths', async () => {
    const employee = await createEmployee({ userId: new UniqueEntityID() });

    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'Onboarding geral',
      description: 'Sem expiração',
      category: 'SOFT_SKILLS',
      format: 'ONLINE',
      durationHours: 2,
      // no validityMonths
    });

    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: program.id,
      employeeId: employee.id,
      status: 'COMPLETED',
    });
    (
      enrollment as unknown as { props: { completedAt: Date | undefined } }
    ).props.completedAt = new Date('2025-12-01');

    const result = await sut.execute({
      tenantId,
      referenceDate: FROZEN_NOW,
    });

    expect(result.notificationsCreated).toBe(0);
  });
});
