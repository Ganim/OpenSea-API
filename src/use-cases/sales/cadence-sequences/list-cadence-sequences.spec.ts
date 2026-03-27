import { InMemoryCadenceSequencesRepository } from '@/repositories/sales/in-memory/in-memory-cadence-sequences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCadenceSequenceUseCase } from './create-cadence-sequence';
import { ListCadenceSequencesUseCase } from './list-cadence-sequences';

let cadenceSequencesRepository: InMemoryCadenceSequencesRepository;
let createUseCase: CreateCadenceSequenceUseCase;
let sut: ListCadenceSequencesUseCase;

describe('ListCadenceSequencesUseCase', () => {
  beforeEach(() => {
    cadenceSequencesRepository = new InMemoryCadenceSequencesRepository();
    createUseCase = new CreateCadenceSequenceUseCase(
      cadenceSequencesRepository,
    );
    sut = new ListCadenceSequencesUseCase(cadenceSequencesRepository);
  });

  it('should list cadence sequences with pagination', async () => {
    for (let sequenceIndex = 0; sequenceIndex < 5; sequenceIndex++) {
      await createUseCase.execute({
        tenantId: 'tenant-1',
        name: `Cadence ${sequenceIndex + 1}`,
        createdBy: 'user-1',
        steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
      });
    }

    const { cadenceSequences, total } = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(cadenceSequences).toHaveLength(3);
    expect(total).toBe(5);
  });

  it('should filter by search term', async () => {
    await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Welcome Sequence',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Follow Up',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'CALL', delayDays: 0 }],
    });

    const { cadenceSequences, total } = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 20,
      search: 'Welcome',
    });

    expect(cadenceSequences).toHaveLength(1);
    expect(total).toBe(1);
    expect(cadenceSequences[0].name).toBe('Welcome Sequence');
  });

  it('should return empty list for different tenant', async () => {
    await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      createdBy: 'user-1',
      steps: [{ order: 1, type: 'EMAIL', delayDays: 0 }],
    });

    const { cadenceSequences, total } = await sut.execute({
      tenantId: 'tenant-2',
      page: 1,
      perPage: 20,
    });

    expect(cadenceSequences).toHaveLength(0);
    expect(total).toBe(0);
  });
});
