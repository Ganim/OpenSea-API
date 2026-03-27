import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateCadenceSequenceUseCase } from './activate-cadence-sequence';
import { AdvanceStepUseCase } from './advance-step';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { EnrollContactUseCase } from './enroll-contact';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let activateUseCase: ActivateCadenceSequenceUseCase;
let enrollUseCase: EnrollContactUseCase;
let sut: AdvanceStepUseCase;

describe('AdvanceStepUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    activateUseCase = new ActivateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    enrollUseCase = new EnrollContactUseCase(cadenceSequencesRepository);
    sut = new AdvanceStepUseCase(cadenceSequencesRepository);
  });

  it('should advance to next step', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      createdBy: 'user-1',
      steps: [
        { order: 1, type: 'EMAIL', delayDays: 0 },
        { order: 2, type: 'CALL', delayDays: 2 },
        { order: 3, type: 'TASK', delayDays: 5 },
      ],
    });

    await activateUseCase.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    const { enrollment } = await enrollUseCase.execute({
      sequenceId: created.id,
      tenantId: 'tenant-1',
      contactId: 'contact-1',
    });

    const { enrollment: advanced } = await sut.execute({
      enrollmentId: enrollment.id,
      tenantId: 'tenant-1',
    });

    expect(advanced.currentStepOrder).toBe(2);
    expect(advanced.status).toBe('ACTIVE');
  });

  it('should complete enrollment at last step', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Short Cadence',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await activateUseCase.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    const { enrollment } = await enrollUseCase.execute({
      sequenceId: created.id,
      tenantId: 'tenant-1',
      contactId: 'contact-1',
    });

    const { enrollment: completed } = await sut.execute({
      enrollmentId: enrollment.id,
      tenantId: 'tenant-1',
    });

    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeTruthy();
  });

  it('should throw if enrollment not found', async () => {
    await expect(() =>
      sut.execute({ enrollmentId: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if enrollment is not active', async () => {
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

    const { enrollment } = await enrollUseCase.execute({
      sequenceId: created.id,
      tenantId: 'tenant-1',
      contactId: 'contact-1',
    });

    // Complete first
    await sut.execute({
      enrollmentId: enrollment.id,
      tenantId: 'tenant-1',
    });

    // Try to advance completed enrollment
    await expect(() =>
      sut.execute({
        enrollmentId: enrollment.id,
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
