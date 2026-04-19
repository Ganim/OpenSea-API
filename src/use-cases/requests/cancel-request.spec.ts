import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelRequestUseCase } from './cancel-request';
import { InMemoryRequestNotifier } from './helpers/in-memory-request-notifier';

describe('CancelRequestUseCase', () => {
  let requestsRepository: InMemoryRequestsRepository;
  let requestHistoryRepository: InMemoryRequestHistoryRepository;
  let notifier: InMemoryRequestNotifier;
  let sut: CancelRequestUseCase;

  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    notifier = new InMemoryRequestNotifier();
    sut = new CancelRequestUseCase(
      requestsRepository,
      requestHistoryRepository,
      notifier,
    );
  });

  it('should be able to cancel a request', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      requesterId: new UniqueEntityID('requester-1'),
      targetType: 'USER',
      targetId: 'target-1',
      assignedToId: new UniqueEntityID('assigned-1'),
      metadata: {},
      requiresApproval: false,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await requestsRepository.create(request);

    const result = await sut.execute({
      requestId: request.id.toString(),
      cancelledById: 'admin-1',
      cancellationReason: 'Requisição duplicada',
      hasCancelAllPermission: true,
    });

    expect(result.success).toBe(true);

    const updatedRequest = await requestsRepository.findById(request.id);
    expect(updatedRequest?.status).toBe('CANCELLED');

    const history = requestHistoryRepository.items.find((h) =>
      h.requestId.equals(request.id),
    );
    expect(history).toBeDefined();
    expect(history?.action).toBe('cancelled');
    expect(history?.description).toBe('Requisição duplicada');

    const recipients = notifier.dispatches.map((d) => d.recipientUserId);
    expect(recipients).toContain('requester-1');
    expect(recipients).toContain('assigned-1');
    expect(
      notifier.dispatches.every((d) => d.category === 'requests.cancelled'),
    ).toBe(true);
  });

  it('should not be able to cancel a non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'non-existent',
        cancelledById: 'user-1',
        cancellationReason: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not notify requester if they cancelled the request', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      requesterId: new UniqueEntityID('requester-1'),
      targetType: 'USER',
      targetId: 'target-1',
      metadata: {},
      requiresApproval: false,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await requestsRepository.create(request);

    await sut.execute({
      requestId: request.id.toString(),
      cancelledById: 'requester-1',
      cancellationReason: 'Não preciso mais',
    });

    expect(notifier.dispatches).toHaveLength(0);
  });

  it('should not be able to cancel a completed request', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      requesterId: new UniqueEntityID('requester-1'),
      targetType: 'USER',
      targetId: 'target-1',
      metadata: {},
      requiresApproval: false,
      submittedAt: new Date(),
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await requestsRepository.create(request);

    await expect(() =>
      sut.execute({
        requestId: request.id.toString(),
        cancelledById: 'admin-1',
        cancellationReason: 'Test',
        hasCancelAllPermission: true,
      }),
    ).rejects.toThrow('Cannot cancel a completed or already cancelled request');
  });
});
