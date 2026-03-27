import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { DeleteCadenceSequenceUseCase } from './delete-cadence-sequence';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let sut: DeleteCadenceSequenceUseCase;

describe('DeleteCadenceSequenceUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new DeleteCadenceSequenceUseCase(cadenceSequencesRepository);
  });

  it('should soft delete a cadence sequence', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'To Delete',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await sut.execute({ id: created.id, tenantId: 'tenant-1' });

    const deletedSequence = cadenceSequencesRepository.sequences.find(
      (sequence) => sequence.id.toString() === created.id,
    );
    expect(deletedSequence?.deletedAt).toBeTruthy();
    expect(deletedSequence?.isActive).toBe(false);
  });

  it('should throw if cadence sequence not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
