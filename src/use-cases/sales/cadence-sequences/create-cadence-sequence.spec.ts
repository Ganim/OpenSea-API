import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let sut: CreateCadenceSequenceUseCase;

const validCadenceInput = {
  tenantId: 'tenant-1',
  name: 'Welcome Sequence',
  description: 'Onboarding cadence for new leads',
  createdBy: 'user-1',
  steps: [
    { order: 1, type: 'EMAIL', delayDays: 0, config: { subject: 'Welcome' } },
    { order: 2, type: 'WAIT', delayDays: 3 },
    {
      order: 3,
      type: 'CALL',
      delayDays: 0,
      config: { script: 'Follow up' },
    },
  ],
};

describe('CreateCadenceSequenceUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    sut = new CreateCadenceSequenceUseCase(cadenceSequencesRepository);
  });

  it('should create a cadence sequence with steps', async () => {
    const { cadenceSequence } = await sut.execute(validCadenceInput);

    expect(cadenceSequence.name).toBe('Welcome Sequence');
    expect(cadenceSequence.isActive).toBe(false);
    expect(cadenceSequence.steps).toHaveLength(3);
    expect(cadenceSequence.steps[0].type).toBe('EMAIL');
    expect(cadenceSequencesRepository.sequences).toHaveLength(1);
  });

  it('should throw if name is empty', async () => {
    await expect(() =>
      sut.execute({ ...validCadenceInput, name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if name exceeds 255 characters', async () => {
    await expect(() =>
      sut.execute({ ...validCadenceInput, name: 'A'.repeat(256) }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if steps array is empty', async () => {
    await expect(() =>
      sut.execute({ ...validCadenceInput, steps: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if step type is invalid', async () => {
    await expect(() =>
      sut.execute({
        ...validCadenceInput,
        steps: [{ order: 1, type: 'INVALID', delayDays: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if step delay days is negative', async () => {
    await expect(() =>
      sut.execute({
        ...validCadenceInput,
        steps: [{ order: 1, type: 'EMAIL', delayDays: -1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
