import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListRequestsUseCase } from './list-requests';

let requestsRepository: InMemoryRequestsRepository;
let sut: ListRequestsUseCase;

describe('ListRequestsUseCase', () => {
  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    sut = new ListRequestsUseCase(requestsRepository);
  });

  it('should list requests for a user', async () => {
    const userId = new UniqueEntityID();
    const req = Request.create({
      title: 'My Req',
      description: 'D',
      type: 'GENERAL',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      requesterId: userId,
      targetType: 'USER',
      metadata: {},
      requiresApproval: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await requestsRepository.create(req);
    const { requests, total } = await sut.execute({
      userId: userId.toString(),
      hasViewAllPermission: false,
    });
    expect(requests).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should return empty list when no requests exist', async () => {
    const { requests, total } = await sut.execute({
      userId: 'u',
      hasViewAllPermission: true,
    });
    expect(requests).toHaveLength(0);
    expect(total).toBe(0);
  });
});
