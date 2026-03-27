import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { UpdateCadenceSequenceUseCase } from './update-cadence-sequence';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let sut: UpdateCadenceSequenceUseCase;

describe('UpdateCadenceSequenceUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new UpdateCadenceSequenceUseCase(cadenceSequencesRepository);
  });

  it('should update cadence sequence name', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Original Name',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    const { cadenceSequence: updated } = await sut.execute({
      id: created.id,
      tenantId: 'tenant-1',
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should update cadence sequence steps', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test Cadence',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    const { cadenceSequence: updated } = await sut.execute({
      id: created.id,
      tenantId: 'tenant-1',
      steps: [
        { order: 1, type: 'EMAIL', delayDays: 0 },
        { order: 2, type: 'CALL', delayDays: 2 },
      ],
    });

    expect(updated.steps).toHaveLength(2);
  });

  it('should throw if cadence sequence not found', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if name is empty', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await expect(() =>
      sut.execute({ id: created.id, tenantId: 'tenant-1', name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if steps array is empty', async () => {
    const { cadenceSequence: created } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await expect(() =>
      sut.execute({ id: created.id, tenantId: 'tenant-1', steps: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
