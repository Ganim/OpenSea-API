import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { EnrollEmployeeUseCase } from './enroll-employee';

let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let sut: EnrollEmployeeUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Enroll Employee Use Case', () => {
  beforeEach(() => {
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    sut = new EnrollEmployeeUseCase(
      trainingEnrollmentsRepository,
      trainingProgramsRepository,
    );
  });

  it('should enroll an employee in a training program', async () => {
    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'NR-35',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    const result = await sut.execute({
      tenantId,
      trainingProgramId: program.id.toString(),
      employeeId,
    });

    expect(result.enrollment).toBeDefined();
    expect(result.enrollment.status).toBe('ENROLLED');
    expect(result.enrollment.employeeId.toString()).toBe(employeeId);
    expect(trainingEnrollmentsRepository.items).toHaveLength(1);
  });

  it('should throw error for non-existent program', async () => {
    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: new UniqueEntityID().toString(),
        employeeId,
      }),
    ).rejects.toThrow('Programa de treinamento não encontrado');
  });

  it('should throw error for inactive program', async () => {
    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'Inactive Program',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: program.id.toString(),
        employeeId,
      }),
    ).rejects.toThrow('O programa de treinamento está inativo');
  });

  it('should throw error for duplicate enrollment', async () => {
    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'NR-35',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    await sut.execute({
      tenantId,
      trainingProgramId: program.id.toString(),
      employeeId,
    });

    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: program.id.toString(),
        employeeId,
      }),
    ).rejects.toThrow(
      'O funcionário já está inscrito neste programa de treinamento',
    );
  });

  it('should throw error when max participants reached', async () => {
    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'Limited Program',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
      maxParticipants: 1,
    });

    await sut.execute({
      tenantId,
      trainingProgramId: program.id.toString(),
      employeeId,
    });

    const anotherEmployeeId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: program.id.toString(),
        employeeId: anotherEmployeeId,
      }),
    ).rejects.toThrow(
      'O programa de treinamento atingiu o limite máximo de participantes',
    );
  });
});
