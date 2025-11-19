import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompleteRequestUseCase } from './complete-request';

describe('CompleteRequestUseCase', () => {
  let requestsRepository: InMemoryRequestsRepository;
  let requestHistoryRepository: InMemoryRequestHistoryRepository;
  let createNotificationUseCase: Partial<CreateNotificationUseCase>;
  let sut: CompleteRequestUseCase;

  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    createNotificationUseCase = {
      execute: vi.fn(),
    };
    sut = new CompleteRequestUseCase(
      requestsRepository,
      requestHistoryRepository,
      createNotificationUseCase as CreateNotificationUseCase,
    );
  });

  it('should be able to complete a request', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      requesterId: new UniqueEntityID('requester-1'),
      assignedToId: new UniqueEntityID('user-1'),
      targetType: 'USER',
      targetId: 'target-1',
      metadata: {},
      requiresApproval: false,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await requestsRepository.create(request);

    const result = await sut.execute({
      requestId: request.id.toString(),
      completedById: 'user-1',
      completionNotes: 'Concluída com sucesso',
    });

    expect(result.success).toBe(true);

    const updatedRequest = await requestsRepository.findById(request.id);
    expect(updatedRequest?.status).toBe('COMPLETED');
    expect(updatedRequest?.completedAt).toBeInstanceOf(Date);

    const history = requestHistoryRepository.items.find((h) =>
      h.requestId.equals(request.id),
    );
    expect(history).toBeDefined();
    expect(history?.action).toBe('completed');

    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: request.requesterId.toString(),
        title: 'Request Completed',
        type: 'SUCCESS',
      }),
    );
  });

  it('should not be able to complete a non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'non-existent',
        completedById: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should complete a request without completion notes', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      requesterId: new UniqueEntityID('requester-1'),
      assignedToId: new UniqueEntityID('user-1'),
      targetType: 'USER',
      targetId: 'target-1',
      metadata: {},
      requiresApproval: false,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await requestsRepository.create(request);

    const result = await sut.execute({
      requestId: request.id.toString(),
      completedById: 'user-1',
    });

    expect(result.success).toBe(true);

    const updatedRequest = await requestsRepository.findById(request.id);
    expect(updatedRequest?.status).toBe('COMPLETED');
  });
});
