import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryRequestNotifier } from './helpers/in-memory-request-notifier';
import { RequestInfoUseCase } from './request-info';

describe('RequestInfoUseCase', () => {
  let requestsRepository: InMemoryRequestsRepository;
  let requestHistoryRepository: InMemoryRequestHistoryRepository;
  let notifier: InMemoryRequestNotifier;
  let sut: RequestInfoUseCase;

  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    notifier = new InMemoryRequestNotifier();
    sut = new RequestInfoUseCase(
      requestsRepository,
      requestHistoryRepository,
      notifier,
    );
  });

  it('should be able to request additional information', async () => {
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
      requestedById: 'assigned-1',
      infoRequested:
        'Por favor, forneça mais detalhes sobre o acesso necessário',
    });

    expect(result.success).toBe(true);

    const updatedRequest = await requestsRepository.findById(request.id);
    expect(updatedRequest?.status).toBe('PENDING_INFO');

    const history = requestHistoryRepository.items.find((h) =>
      h.requestId.equals(request.id),
    );
    expect(history).toBeDefined();
    expect(history?.action).toBe('info_requested');
    expect(history?.description).toContain('mais detalhes');

    expect(notifier.dispatches).toHaveLength(1);
    expect(notifier.dispatches[0]).toMatchObject({
      recipientUserId: 'requester-1',
      category: 'requests.info_requested',
    });
  });

  it('should not be able to request info from a non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'non-existent',
        requestedById: 'user-1',
        infoRequested: 'Test info',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to request info from a non in-progress request', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'SUBMITTED',
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

    await expect(() =>
      sut.execute({
        requestId: request.id.toString(),
        requestedById: 'user-1',
        infoRequested: 'Test info',
      }),
    ).rejects.toThrow(
      'Can only request additional information from in-progress requests',
    );
  });
});
