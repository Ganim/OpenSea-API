import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateCadenceSequenceUseCase } from './activate-cadence-sequence';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let sut: ActivateCadenceSequenceUseCase;

describe('ActivateCadenceSequenceUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new ActivateCadenceSequenceUseCase(cadenceSequencesRepository);
  });

  it('should activate a cadence sequence', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    expect(created.isActive).toBe(false);

    const { cadenceSequence: activated } = await sut.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    expect(activated.isActive).toBe(true);
  });

  it('should throw if not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
