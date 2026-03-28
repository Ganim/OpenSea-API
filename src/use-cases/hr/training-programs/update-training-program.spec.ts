import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateTrainingProgramUseCase } from './update-training-program';

let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let sut: UpdateTrainingProgramUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Training Program Use Case', () => {
  beforeEach(() => {
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    sut = new UpdateTrainingProgramUseCase(trainingProgramsRepository);
  });

  it('should update a training program', async () => {
    const created = await trainingProgramsRepository.create({
      tenantId,
      name: 'Original Name',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    const result = await sut.execute({
      tenantId,
      trainingProgramId: created.id.toString(),
      name: 'Updated Name',
      durationHours: 16,
    });

    expect(result.trainingProgram.name).toBe('Updated Name');
    expect(result.trainingProgram.durationHours).toBe(16);
  });

  it('should throw error for non-existent program', async () => {
    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: new UniqueEntityID().toString(),
        name: 'Updated',
      }),
    ).rejects.toThrow('Programa de treinamento não encontrado');
  });

  it('should throw error for empty name', async () => {
    const created = await trainingProgramsRepository.create({
      tenantId,
      name: 'Original Name',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: created.id.toString(),
        name: '',
      }),
    ).rejects.toThrow('O nome do programa de treinamento é obrigatório');
  });

  it('should deactivate a program', async () => {
    const created = await trainingProgramsRepository.create({
      tenantId,
      name: 'Active Program',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    const result = await sut.execute({
      tenantId,
      trainingProgramId: created.id.toString(),
      isActive: false,
    });

    expect(result.trainingProgram.isActive).toBe(false);
  });
});
