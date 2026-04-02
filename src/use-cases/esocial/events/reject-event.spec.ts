import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { RejectEventUseCase } from './reject-event';

describe('RejectEventUseCase', () => {
  let sut: RejectEventUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new RejectEventUseCase(eventsRepository);
  });

  it('should throw ResourceNotFoundError if event not found', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        reason: 'Invalid data',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if event is not REVIEWED or VALIDATED', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue({
      status: EsocialEventStatus.DRAFT,
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        reason: 'Bad data',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject a REVIEWED event back to DRAFT', async () => {
    const mockEvent = {
      status: EsocialEventStatus.REVIEWED,
      backToDraft: vi.fn(),
      updateXml: vi.fn(),
      xmlContent: '<xml/>',
      xmlHash: 'abc123',
    };

    vi.mocked(eventsRepository.findById).mockResolvedValue(
      mockEvent as unknown,
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      reason: 'Incorrect CPF',
    });

    expect(mockEvent.backToDraft).toHaveBeenCalled();
    expect(eventsRepository.save).toHaveBeenCalledWith(mockEvent);
    expect(result.event).toBe(mockEvent);
  });

  it('should reject a VALIDATED event', async () => {
    const mockEvent = {
      status: EsocialEventStatus.VALIDATED,
      backToDraft: vi.fn(),
      updateXml: vi.fn(),
      xmlContent: '<xml/>',
      xmlHash: 'hash',
    };

    vi.mocked(eventsRepository.findById).mockResolvedValue(
      mockEvent as unknown,
    );

    await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      reason: 'Missing field',
    });

    expect(mockEvent.backToDraft).toHaveBeenCalled();
  });
});
