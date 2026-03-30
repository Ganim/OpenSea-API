import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryReviewCyclesRepository } from '@/repositories/hr/in-memory/in-memory-review-cycles-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListReviewCyclesUseCase } from './list-review-cycles';

let reviewCyclesRepository: InMemoryReviewCyclesRepository;
let sut: ListReviewCyclesUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Review Cycles Use Case', () => {
  beforeEach(async () => {
    reviewCyclesRepository = new InMemoryReviewCyclesRepository();
    sut = new ListReviewCyclesUseCase(reviewCyclesRepository);

    await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'OPEN',
    });

    await reviewCyclesRepository.create({
      tenantId,
      name: 'Avaliação Semestral S1',
      type: 'SEMI_ANNUAL',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      status: 'DRAFT',
    });
  });

  it('should list all review cycles for a tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.reviewCycles).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by type', async () => {
    const result = await sut.execute({ tenantId, type: 'ANNUAL' });

    expect(result.reviewCycles).toHaveLength(1);
    expect(result.reviewCycles[0].type).toBe('ANNUAL');
  });

  it('should filter by status', async () => {
    const result = await sut.execute({ tenantId, status: 'DRAFT' });

    expect(result.reviewCycles).toHaveLength(1);
    expect(result.reviewCycles[0].status).toBe('DRAFT');
  });

  it('should filter by search term', async () => {
    const result = await sut.execute({ tenantId, search: 'Semestral' });

    expect(result.reviewCycles).toHaveLength(1);
    expect(result.reviewCycles[0].name).toContain('Semestral');
  });

  it('should paginate results', async () => {
    const result = await sut.execute({ tenantId, page: 1, perPage: 1 });

    expect(result.reviewCycles).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
