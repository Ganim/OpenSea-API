import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTrainingProgramUseCase } from './get-training-program';

let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let sut: GetTrainingProgramUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Training Program Use Case', () => {
  beforeEach(() => {
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    sut = new GetTrainingProgramUseCase(trainingProgramsRepository);
  });

  it('should get a training program by id', async () => {
    const created = await trainingProgramsRepository.create({
      tenantId,
      name: 'NR-35 Trabalho em Altura',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    const result = await sut.execute({
      tenantId,
      trainingProgramId: created.id.toString(),
    });

    expect(result.trainingProgram.name).toBe('NR-35 Trabalho em Altura');
  });

  it('should throw error for non-existent program', async () => {
    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Programa de treinamento não encontrado');
  });

  it('should not find program from another tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const created = await trainingProgramsRepository.create({
      tenantId: otherTenantId,
      name: 'Other Tenant Program',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
    });

    await expect(
      sut.execute({
        tenantId,
        trainingProgramId: created.id.toString(),
      }),
    ).rejects.toThrow('Programa de treinamento não encontrado');
  });
});
