import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteTrainingProgramUseCase } from './delete-training-program';

let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let sut: DeleteTrainingProgramUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Training Program Use Case', () => {
  beforeEach(() => {
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    sut = new DeleteTrainingProgramUseCase(trainingProgramsRepository);
  });

  it('should soft delete a training program', async () => {
    const created = await trainingProgramsRepository.create({
      tenantId,
      name: 'Program to Delete',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    const result = await sut.execute({
      tenantId,
      trainingProgramId: created.id.toString(),
    });

    expect(result.trainingProgram.deletedAt).toBeDefined();
    expect(result.trainingProgram.isActive).toBe(false);
  });

  it('should throw error for non-existent program', async () => {
    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Programa de treinamento não encontrado');
  });

  it('should not find soft deleted program', async () => {
    const created = await trainingProgramsRepository.create({
      tenantId,
      name: 'Program to Delete',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    await sut.execute({
      tenantId,
      trainingProgramId: created.id.toString(),
    });

    const found = await trainingProgramsRepository.findById(
      created.id,
      tenantId,
    );

    expect(found).toBeNull();
  });
});
