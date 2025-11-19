import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CancelRequestUseCase } from './cancel-request';

describe('CancelRequestUseCase', () => {
  let requestsRepository: InMemoryRequestsRepository;
  let requestHistoryRepository: InMemoryRequestHistoryRepository;
  let createNotificationUseCase: Partial<CreateNotificationUseCase>;
  let sut: CancelRequestUseCase;

  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    createNotificationUseCase = {
      execute: vi.fn(),
    };
    sut = new CancelRequestUseCase(
      requestsRepository,
      requestHistoryRepository,
      createNotificationUseCase as CreateNotificationUseCase,
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
      userRole: 'ADMIN',
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

    // Deve notificar o solicitante
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'requester-1',
        title: 'Request Cancelled',
        type: 'WARNING',
      }),
    );

    // Deve notificar o atribuído
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'assigned-1',
        title: 'Request Cancelled',
        type: 'WARNING',
      }),
    );
  });

  it('should not be able to cancel a non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'non-existent',
        cancelledById: 'user-1',
        cancellationReason: 'Test',
        userRole: 'USER',
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
      userRole: 'USER',
    });

    // Não deve enviar notificação para o próprio solicitante
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
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
        userRole: 'ADMIN',
      }),
    ).rejects.toThrow('Cannot cancel a completed or already cancelled request');
  });
});
