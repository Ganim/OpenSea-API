import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListActivitiesUseCase } from './list-activities';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: ListActivitiesUseCase;

const TENANT_ID = 'tenant-1';

describe('ListActivitiesUseCase', () => {
  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new ListActivitiesUseCase(activitiesRepository);
  });

  it('should list activities by contactId', async () => {
    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Note 1',
      contactId: 'contact-1',
    });

    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'CALL',
      title: 'Call 1',
      contactId: 'contact-2',
    });

    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'MEETING',
      title: 'Meeting 1',
      contactId: 'contact-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      contactId: 'contact-1',
    });

    expect(result.activities).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(
      result.activities.every(
        (a) => a.contactId?.toString() === 'contact-1',
      ),
    ).toBe(true);
  });

  it('should list activities by dealId', async () => {
    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Note for deal',
      dealId: 'deal-1',
    });

    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'CALL',
      title: 'Unrelated call',
      contactId: 'contact-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      dealId: 'deal-1',
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].title).toBe('Note for deal');
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await activitiesRepository.create({
        tenantId: TENANT_ID,
        type: 'NOTE',
        title: `Note ${i + 1}`,
        contactId: 'contact-1',
      });
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
      contactId: 'contact-1',
    });

    expect(result.activities).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });
});
