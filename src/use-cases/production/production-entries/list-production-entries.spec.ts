import { InMemoryProductionEntriesRepository } from '@/repositories/production/in-memory/in-memory-production-entries-repository';
import { ListProductionEntriesUseCase } from './list-production-entries';

let productionEntriesRepository: InMemoryProductionEntriesRepository;
let sut: ListProductionEntriesUseCase;

describe('ListProductionEntriesUseCase', () => {
  beforeEach(() => {
    productionEntriesRepository = new InMemoryProductionEntriesRepository();
    sut = new ListProductionEntriesUseCase(productionEntriesRepository);
  });

  it('should list production entries by job card id', async () => {
    await productionEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      quantityGood: 50,
    });

    await productionEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-2',
      quantityGood: 30,
    });

    await productionEntriesRepository.create({
      jobCardId: 'job-card-2',
      operatorId: 'operator-1',
      quantityGood: 20,
    });

    const { productionEntries } = await sut.execute({
      jobCardId: 'job-card-1',
    });

    expect(productionEntries).toHaveLength(2);
  });

  it('should return empty array when no entries exist for job card', async () => {
    const { productionEntries } = await sut.execute({
      jobCardId: 'non-existent',
    });

    expect(productionEntries).toHaveLength(0);
  });
});
