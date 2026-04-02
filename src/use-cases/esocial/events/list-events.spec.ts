import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { ListEventsUseCase } from './list-events';

describe('ListEventsUseCase', () => {
  let sut: ListEventsUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ events: [], total: 0 }),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new ListEventsUseCase(eventsRepository);
  });

  it('should list events with default pagination', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(eventsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        page: 1,
        perPage: 20,
      }),
    );
    expect(result.events).toEqual([]);
    expect(result.meta).toEqual({
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
  });

  it('should pass filters to repository', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      status: 'DRAFT',
      eventType: 'S-2200',
      page: 2,
      perPage: 10,
    });

    expect(eventsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DRAFT',
        eventType: 'S-2200',
        page: 2,
        perPage: 10,
      }),
    );
  });

  it('should calculate total pages correctly', async () => {
    vi.mocked(eventsRepository.findMany).mockResolvedValue({
      events: [] as unknown,
      total: 45,
    });

    const result = await sut.execute({ tenantId: 'tenant-1', perPage: 10 });

    expect(result.meta.totalPages).toBe(5);
  });
});
