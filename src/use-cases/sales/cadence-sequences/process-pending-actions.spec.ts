import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateCadenceSequenceUseCase } from './activate-cadence-sequence';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { EnrollContactUseCase } from './enroll-contact';
import { ProcessPendingActionsUseCase } from './process-pending-actions';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let activateUseCase: ActivateCadenceSequenceUseCase;
let enrollUseCase: EnrollContactUseCase;
let sut: ProcessPendingActionsUseCase;

describe('ProcessPendingActionsUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    activateUseCase = new ActivateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    enrollUseCase = new EnrollContactUseCase(cadenceSequencesRepository);
    sut = new ProcessPendingActionsUseCase(cadenceSequencesRepository);
  });

  it('should process pending enrollments and advance them', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test Cadence',
      createdBy: 'user-1',
      steps: [
        { order: 1, type: 'EMAIL', delayDays: 0 },
        { order: 2, type: 'CALL', delayDays: 0 },
      ],
    });

    await activateUseCase.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    await enrollUseCase.execute({
      sequenceId: created.id,
      tenantId: 'tenant-1',
      contactId: 'contact-1',
    });

    // Set nextActionAt to past so it's "pending"
    cadenceSequencesRepository.enrollments[0].nextActionAt = new Date(
      Date.now() - 60000,
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.processedCount).toBe(1);
    expect(result.advancedCount).toBe(1);
    expect(result.completedCount).toBe(0);
  });

  it('should complete enrollment when on last step', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Single Step',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await activateUseCase.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    await enrollUseCase.execute({
      sequenceId: created.id,
      tenantId: 'tenant-1',
      contactId: 'contact-1',
    });

    cadenceSequencesRepository.enrollments[0].nextActionAt = new Date(
      Date.now() - 60000,
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.processedCount).toBe(1);
    expect(result.completedCount).toBe(1);
    expect(result.advancedCount).toBe(0);
  });

  it('should return zero counts when no pending actions', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.processedCount).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.advancedCount).toBe(0);
  });
});
