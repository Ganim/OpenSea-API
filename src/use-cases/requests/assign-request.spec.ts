import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AssignRequestUseCase } from './assign-request';

let requestsRepository: InMemoryRequestsRepository;
let requestHistoryRepository: InMemoryRequestHistoryRepository;
let sut: AssignRequestUseCase;

import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

const mockNotification = {
  execute: async () => ({ notification: {} }),
} as unknown as CreateNotificationUseCase;

describe('AssignRequestUseCase', () => {
  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    sut = new AssignRequestUseCase(
      requestsRepository,
      requestHistoryRepository,
      mockNotification,
    );
  });

  it('should assign a request to a user', async () => {
    const reqId = new UniqueEntityID();
    const req = Request.create({
      title: 'Test',
      description: 'Desc',
      type: 'CUSTOM',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      requesterId: reqId,
      targetType: 'USER',
      metadata: {},
      requiresApproval: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await requestsRepository.create(req);
    const { success } = await sut.execute({
      requestId: req.id.toString(),
      assignedToId: 'u2',
      performedById: reqId.toString(),
      hasAssignPermission: true,
    });
    expect(success).toBe(true);
  });

  it('should throw ForbiddenError without permission', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'x',
        assignedToId: 'x',
        performedById: 'x',
        hasAssignPermission: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError for non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'no',
        assignedToId: 'u',
        performedById: 'a',
        hasAssignPermission: true,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
