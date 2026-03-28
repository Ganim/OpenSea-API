import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTrainingProgramUseCase } from './create-training-program';

let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let sut: CreateTrainingProgramUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Training Program Use Case', () => {
  beforeEach(() => {
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    sut = new CreateTrainingProgramUseCase(trainingProgramsRepository);
  });

  it('should create a training program successfully', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Segurança do Trabalho NR-35',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
      instructor: 'João Silva',
      description: 'Treinamento sobre trabalho em altura',
    });

    expect(result.trainingProgram).toBeDefined();
    expect(result.trainingProgram.name).toBe('Segurança do Trabalho NR-35');
    expect(result.trainingProgram.category).toBe('SAFETY');
    expect(result.trainingProgram.format).toBe('PRESENCIAL');
    expect(result.trainingProgram.durationHours).toBe(8);
    expect(result.trainingProgram.isActive).toBe(true);
    expect(result.trainingProgram.isMandatory).toBe(false);
    expect(trainingProgramsRepository.items).toHaveLength(1);
  });

  it('should create a mandatory online training', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Compliance LGPD',
      category: 'COMPLIANCE',
      format: 'ONLINE',
      durationHours: 4,
      isMandatory: true,
      validityMonths: 12,
    });

    expect(result.trainingProgram.isMandatory).toBe(true);
    expect(result.trainingProgram.validityMonths).toBe(12);
    expect(result.trainingProgram.format).toBe('ONLINE');
  });

  it('should throw error for empty name', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '',
        category: 'SAFETY',
        format: 'PRESENCIAL',
        durationHours: 8,
      }),
    ).rejects.toThrow('O nome do programa de treinamento é obrigatório');
  });

  it('should throw error for invalid category', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Test Program',
        category: 'INVALID_CATEGORY',
        format: 'PRESENCIAL',
        durationHours: 8,
      }),
    ).rejects.toThrow('Categoria inválida');
  });

  it('should throw error for invalid format', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Test Program',
        category: 'SAFETY',
        format: 'INVALID_FORMAT',
        durationHours: 8,
      }),
    ).rejects.toThrow('Formato inválido');
  });

  it('should throw error for zero duration', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Test Program',
        category: 'SAFETY',
        format: 'PRESENCIAL',
        durationHours: 0,
      }),
    ).rejects.toThrow('A duração em horas deve ser maior que zero');
  });

  it('should trim whitespace from name', async () => {
    const result = await sut.execute({
      tenantId,
      name: '  Treinamento de Liderança  ',
      category: 'LEADERSHIP',
      format: 'HIBRIDO',
      durationHours: 16,
    });

    expect(result.trainingProgram.name).toBe('Treinamento de Liderança');
  });

  it('should create multiple programs for the same tenant', async () => {
    await sut.execute({
      tenantId,
      name: 'Program 1',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });
    await sut.execute({
      tenantId,
      name: 'Program 2',
      category: 'TECHNICAL',
      format: 'ONLINE',
      durationHours: 4,
    });

    expect(trainingProgramsRepository.items).toHaveLength(2);
  });
});
