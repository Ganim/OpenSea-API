import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { InMemoryProductionEntriesRepository } from '@/repositories/production/in-memory/in-memory-production-entries-repository';
import { CreateProductionEntryUseCase } from './create-production-entry';

let productionEntriesRepository: InMemoryProductionEntriesRepository;
let jobCardsRepository: InMemoryJobCardsRepository;
let sut: CreateProductionEntryUseCase;

describe('CreateProductionEntryUseCase', () => {
  beforeEach(async () => {
    productionEntriesRepository = new InMemoryProductionEntriesRepository();
    jobCardsRepository = new InMemoryJobCardsRepository();
    sut = new CreateProductionEntryUseCase(
      productionEntriesRepository,
      jobCardsRepository,
    );

    // Create an IN_PROGRESS job card for tests
    await jobCardsRepository.create({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      status: 'IN_PROGRESS',
      quantityPlanned: 100,
    });
  });

  it('should create a production entry with default scrap/rework values', async () => {
    const jobCard = jobCardsRepository.items[0];
    const { productionEntry } = await sut.execute({
      jobCardId: jobCard.jobCardId.toString(),
      operatorId: 'operator-1',
      quantityGood: 100,
    });

    expect(productionEntry.jobCardId.toString()).toBe(
      jobCard.jobCardId.toString(),
    );
    expect(productionEntry.operatorId.toString()).toBe('operator-1');
    expect(productionEntry.quantityGood).toBe(100);
    expect(productionEntry.quantityScrapped).toBe(0);
    expect(productionEntry.quantityRework).toBe(0);
    expect(productionEntry.totalQuantity).toBe(100);
    expect(productionEntriesRepository.items).toHaveLength(1);
  });

  it('should create a production entry with scrap and rework', async () => {
    const jobCard = jobCardsRepository.items[0];
    const { productionEntry } = await sut.execute({
      jobCardId: jobCard.jobCardId.toString(),
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

  it('should throw if job card not found', async () => {
    await expect(
      sut.execute({
        jobCardId: 'non-existent',
        operatorId: 'operator-1',
        quantityGood: 10,
      }),
    ).rejects.toThrow('Job card not found');
  });

  it('should throw if job card is not IN_PROGRESS', async () => {
    await jobCardsRepository.create({
      productionOrderId: 'order-2',
      operationRoutingId: 'routing-2',
      status: 'PENDING',
      quantityPlanned: 50,
    });
    const pendingCard = jobCardsRepository.items[1];

    await expect(
      sut.execute({
        jobCardId: pendingCard.jobCardId.toString(),
        operatorId: 'operator-1',
        quantityGood: 10,
      }),
    ).rejects.toThrow('Job card must be IN_PROGRESS');
  });

  it('should throw if total quantity is zero', async () => {
    const jobCard = jobCardsRepository.items[0];
    await expect(
      sut.execute({
        jobCardId: jobCard.jobCardId.toString(),
        operatorId: 'operator-1',
        quantityGood: 0,
        quantityScrapped: 0,
        quantityRework: 0,
      }),
    ).rejects.toThrow('Total quantity must be greater than zero');
  });
});
