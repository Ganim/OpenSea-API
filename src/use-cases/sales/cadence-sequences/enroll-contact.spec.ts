import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateCadenceSequenceUseCase } from './activate-cadence-sequence';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { EnrollContactUseCase } from './enroll-contact';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let activateUseCase: ActivateCadenceSequenceUseCase;
let sut: EnrollContactUseCase;

describe('EnrollContactUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    activateUseCase = new ActivateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new EnrollContactUseCase(cadenceSequencesRepository);
  });

  it('should enroll a contact in an active cadence', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test Cadence',
      createdBy: 'user-1',
      steps: [
        { order: 1, type: 'EMAIL', delayDays: 0 },
        { order: 2, type: 'CALL', delayDays: 3 },
      ],
    });

    await activateUseCase.execute({
      id: created.id,
      tenantId: 'tenant-1',
    });

    const { enrollment } = await sut.execute({
      sequenceId: created.id,
      tenantId: 'tenant-1',
      contactId: 'contact-1',
    });

    expect(enrollment.status).toBe('ACTIVE');
    expect(enrollment.currentStepOrder).toBe(1);
    expect(enrollment.contactId).toBe('contact-1');
    expect(enrollment.nextActionAt).toBeTruthy();
    expect(cadenceSequencesRepository.enrollments).toHaveLength(1);
  });

  it('should throw if neither contactId nor dealId provided', async () => {
    await expect(() =>
      sut.execute({
        sequenceId: 'seq-1',
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if cadence sequence not found', async () => {
    await expect(() =>
      sut.execute({
        sequenceId: 'non-existent',
        tenantId: 'tenant-1',
        contactId: 'contact-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if cadence is inactive', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Inactive Cadence',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await expect(() =>
      sut.execute({
        sequenceId: created.id,
        tenantId: 'tenant-1',
        contactId: 'contact-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
