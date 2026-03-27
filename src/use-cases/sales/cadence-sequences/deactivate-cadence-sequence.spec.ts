import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateCadenceSequenceUseCase } from './activate-cadence-sequence';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { DeactivateCadenceSequenceUseCase } from './deactivate-cadence-sequence';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let activateUseCase: ActivateCadenceSequenceUseCase;
let sut: DeactivateCadenceSequenceUseCase;

describe('DeactivateCadenceSequenceUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    activateUseCase = new ActivateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new DeactivateCadenceSequenceUseCase(cadenceSequencesRepository);
  });

  it('should deactivate a cadence sequence', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await activateUseCase.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    const { cadenceSequence: deactivated } = await sut.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    expect(deactivated.isActive).toBe(false);
  });

  it('should throw if not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
