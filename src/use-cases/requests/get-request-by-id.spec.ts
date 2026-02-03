import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetRequestByIdUseCase } from './get-request-by-id';

let requestsRepository: InMemoryRequestsRepository;
let sut: GetRequestByIdUseCase;

describe('GetRequestByIdUseCase', () => {
  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    sut = new GetRequestByIdUseCase(requestsRepository);
  });

  it('should return a request when user is the requester', async () => {
    const reqId = new UniqueEntityID();
    const req = Request.create({
      title: 'Test',
      description: 'D',
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
    const response = await sut.execute({
      requestId: req.id.toString(),
      userId: reqId.toString(),
    });
    expect(response.request.title).toBe('Test');
  });

  it('should throw ResourceNotFoundError for non-existent request', async () => {
    await expect(() =>
      sut.execute({ requestId: 'no', userId: 'u' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when user has no permission', async () => {
    const reqId = new UniqueEntityID();
    const req = Request.create({
      title: 'T',
      description: 'D',
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
    await expect(() =>
      sut.execute({
        requestId: req.id.toString(),
        userId: 'other',
        hasViewAllPermission: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
