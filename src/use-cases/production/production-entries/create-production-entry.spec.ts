import { InMemoryProductionEntriesRepository } from '@/repositories/production/in-memory/in-memory-production-entries-repository';
import { CreateProductionEntryUseCase } from './create-production-entry';

let productionEntriesRepository: InMemoryProductionEntriesRepository;
let sut: CreateProductionEntryUseCase;

describe('CreateProductionEntryUseCase', () => {
  beforeEach(() => {
    productionEntriesRepository = new InMemoryProductionEntriesRepository();
    sut = new CreateProductionEntryUseCase(productionEntriesRepository);
  });

  it('should create a production entry with default scrap/rework values', async () => {
    const { productionEntry } = await sut.execute({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      quantityGood: 100,
    });

    expect(productionEntry.jobCardId.toString()).toBe('job-card-1');
    expect(productionEntry.operatorId.toString()).toBe('operator-1');
    expect(productionEntry.quantityGood).toBe(100);
    expect(productionEntry.quantityScrapped).toBe(0);
    expect(productionEntry.quantityRework).toBe(0);
    expect(productionEntry.totalQuantity).toBe(100);
    expect(productionEntriesRepository.items).toHaveLength(1);
  });

  it('should create a production entry with scrap and rework', async () => {
    const { productionEntry } = await sut.execute({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      quantityGood: 90,
      quantityScrapped: 5,
      quantityRework: 5,
      notes: 'Minor defects on 10 units',
    });

    expect(productionEntry.quantityGood).toBe(90);
    expect(productionEntry.quantityScrapped).toBe(5);
    expect(productionEntry.quantityRework).toBe(5);
    expect(productionEntry.totalQuantity).toBe(100);
    expect(productionEntry.notes).toBe('Minor defects on 10 units');
  });
});
