import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { ApproveEventUseCase } from './approve-event';

describe('ApproveEventUseCase', () => {
  let sut: ApproveEventUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new ApproveEventUseCase(eventsRepository);
  });

  it('should throw ResourceNotFoundError if event not found', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        approvedBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if event is not REVIEWED', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue({
      status: EsocialEventStatus.DRAFT,
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        approvedBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should approve a REVIEWED event', async () => {
    const mockEvent = {
      status: EsocialEventStatus.REVIEWED,
      markApproved: vi.fn(),
    };

    vi.mocked(eventsRepository.findById).mockResolvedValue(
      mockEvent as unknown,
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      approvedBy: 'user-1',
    });

    expect(mockEvent.markApproved).toHaveBeenCalledWith('user-1');
    expect(eventsRepository.save).toHaveBeenCalledWith(mockEvent);
    expect(result.event).toBe(mockEvent);
  });
});
