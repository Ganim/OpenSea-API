import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateRequestUseCase } from './create-request';

let requestsRepository: InMemoryRequestsRepository;
let requestHistoryRepository: InMemoryRequestHistoryRepository;
let sut: CreateRequestUseCase;

import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

const mockNotification = {
  execute: async () => ({ notification: {} }),
} as unknown as CreateNotificationUseCase;

describe('CreateRequestUseCase', () => {
  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    sut = new CreateRequestUseCase(
      requestsRepository,
      requestHistoryRepository,
      mockNotification,
    );
  });

  it('should create a request', async () => {
    const { request } = await sut.execute({
      title: 'New Request',
      description: 'Desc',
      type: 'CUSTOM',
      targetType: 'USER',
      requesterId: 'u1',
    });
    expect(request).toBeDefined();
    expect(request.title).toBe('New Request');
    expect(request.status).toBe('SUBMITTED');
    expect(requestsRepository.items).toHaveLength(1);
  });

  it('should set default priority to MEDIUM', async () => {
    const { request } = await sut.execute({
      title: 'R',
      description: 'D',
      type: 'CUSTOM',
      targetType: 'USER',
      requesterId: 'u1',
    });
    expect(request.priority).toBe('MEDIUM');
  });

  it('should calculate SLA deadline', async () => {
    const { request } = await sut.execute({
      title: 'R',
      description: 'D',
      type: 'CUSTOM',
      targetType: 'USER',
      requesterId: 'u1',
    });
    expect(request.slaDeadline).toBeDefined();
  });
});
