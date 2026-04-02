import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { RectifyEventUseCase } from './rectify-event';

describe('RectifyEventUseCase', () => {
  let sut: RectifyEventUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn().mockResolvedValue({
        id: { toString: () => 'rectified-1' },
        eventType: 'S-2200',
        isRectification: true,
      }),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new RectifyEventUseCase(eventsRepository);
  });

  it('should throw ResourceNotFoundError if original event not found', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        xmlContent: '<xml/>',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if event is not ACCEPTED', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue({
      status: EsocialEventStatus.DRAFT,
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        xmlContent: '<xml/>',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should create rectification event from ACCEPTED event', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue({
      id: { toString: () => 'original-1' },
      status: EsocialEventStatus.ACCEPTED,
      eventType: 'S-2200',
      referenceId: 'emp-1',
      referenceType: 'EMPLOYEE',
    } as unknown);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'original-1',
      xmlContent: '<rectified-xml/>',
    });

    expect(eventsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        eventType: 'S-2200',
        referenceId: 'emp-1',
        referenceType: 'EMPLOYEE',
        originalEventId: 'original-1',
        isRectification: true,
        status: 'DRAFT',
      }),
    );
    expect(result.event).toBeDefined();
  });
});
