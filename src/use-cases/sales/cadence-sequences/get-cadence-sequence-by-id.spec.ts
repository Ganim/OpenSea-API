import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { GetCadenceSequenceByIdUseCase } from './get-cadence-sequence-by-id';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let sut: GetCadenceSequenceByIdUseCase;

describe('GetCadenceSequenceByIdUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new GetCadenceSequenceByIdUseCase(cadenceSequencesRepository);
  });

  it('should return a cadence sequence by id', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test Cadence',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    const { cadenceSequence } = await sut.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    expect(cadenceSequence.name).toBe('Test Cadence');
    expect(cadenceSequence.steps).toHaveLength(1);
  });

  it('should throw if cadence sequence not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
