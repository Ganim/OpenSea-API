import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryRequestNotifier } from './helpers/in-memory-request-notifier';
import { ProvideInfoUseCase } from './provide-info';

describe('ProvideInfoUseCase', () => {
  let requestsRepository: InMemoryRequestsRepository;
  let requestHistoryRepository: InMemoryRequestHistoryRepository;
  let notifier: InMemoryRequestNotifier;
  let sut: ProvideInfoUseCase;

  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    notifier = new InMemoryRequestNotifier();
    sut = new ProvideInfoUseCase(
      requestsRepository,
      requestHistoryRepository,
      notifier,
    );
  });

  it('should be able to provide requested information', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'PENDING_INFO',
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
      providedById: 'requester-1',
      informationProvided: 'Acesso necessário para o sistema XYZ, sala 101',
    });

    expect(result.success).toBe(true);

    const updatedRequest = await requestsRepository.findById(request.id);
    expect(updatedRequest?.status).toBe('SUBMITTED');

    const history = requestHistoryRepository.items.find((h) =>
      h.requestId.equals(request.id),
    );
    expect(history).toBeDefined();
    expect(history?.action).toBe('info_provided');
    expect(history?.description).toContain('sistema XYZ');

    expect(notifier.dispatches).toHaveLength(1);
    expect(notifier.dispatches[0]).toMatchObject({
      recipientUserId: 'assigned-1',
      category: 'requests.info_provided',
    });
  });

  it('should not be able to provide info for a non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'non-existent',
        providedById: 'user-1',
        informationProvided: 'Test info',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to provide info for a non pending-info request', async () => {
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
        providedById: 'requester-1',
        informationProvided: 'Test info',
      }),
    ).rejects.toThrow(
      'Can only provide information for requests that are pending additional info',
    );
  });

  it('should not notify if request has no assignee', async () => {
    const request = Request.create({
      title: 'Test Request',
      description: 'Test Description',
      type: 'ACCESS_REQUEST',
      category: 'IT',
      status: 'PENDING_INFO',
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
      providedById: 'requester-1',
      informationProvided: 'Additional info',
    });

    expect(notifier.dispatches).toHaveLength(0);
  });
});
