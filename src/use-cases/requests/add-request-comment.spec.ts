import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import { InMemoryRequestCommentsRepository } from '@/repositories/requests/in-memory/in-memory-request-comments-repository';
import { InMemoryRequestHistoryRepository } from '@/repositories/requests/in-memory/in-memory-request-history-repository';
import { InMemoryRequestsRepository } from '@/repositories/requests/in-memory/in-memory-requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddRequestCommentUseCase } from './add-request-comment';

describe('AddRequestCommentUseCase', () => {
  let requestsRepository: InMemoryRequestsRepository;
  let requestCommentsRepository: InMemoryRequestCommentsRepository;
  let requestHistoryRepository: InMemoryRequestHistoryRepository;
  let createNotificationUseCase: Partial<CreateNotificationUseCase>;
  let sut: AddRequestCommentUseCase;

  beforeEach(() => {
    requestsRepository = new InMemoryRequestsRepository();
    requestCommentsRepository = new InMemoryRequestCommentsRepository();
    requestHistoryRepository = new InMemoryRequestHistoryRepository();
    createNotificationUseCase = {
      execute: vi.fn(),
    };
    sut = new AddRequestCommentUseCase(
      requestsRepository,
      requestCommentsRepository,
      requestHistoryRepository,
      createNotificationUseCase as CreateNotificationUseCase,
    );
  });

  it('should be able to add a comment to a request', async () => {
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
      authorId: 'assigned-1',
      content: 'Este é um comentário de teste',
    });

    expect(result.comment).toBeDefined();
    expect(result.comment.content).toBe('Este é um comentário de teste');

    const comments = await requestCommentsRepository.findManyByRequestId(
      request.id,
    );
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Este é um comentário de teste');

    const history = requestHistoryRepository.items.find((h) =>
      h.requestId.equals(request.id),
    );
    expect(history).toBeDefined();
    expect(history?.action).toBe('comment_added');

    // Deve notificar o solicitante (não o autor)
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'requester-1',
        title: 'New Comment',
        type: 'INFO',
      }),
    );
  });

  it('should not be able to add a comment to a non-existent request', async () => {
    await expect(() =>
      sut.execute({
        requestId: 'non-existent',
        authorId: 'user-1',
        content: 'Test comment',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should be able to add an internal comment', async () => {
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
      authorId: 'admin-1',
      content: 'Comentário interno apenas para equipe',
      isInternal: true,
      hasViewAllPermission: true,
    });

    expect(result.comment.isInternal).toBe(true);
  });

  it('should not notify the author of the comment', async () => {
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

    await sut.execute({
      requestId: request.id.toString(),
      authorId: 'requester-1',
      content: 'Meu próprio comentário',
    });

    // Não deve enviar notificação (não tem atribuído e autor é o solicitante)
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it('should truncate long comments in notification', async () => {
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

    const longComment = 'A'.repeat(200);

    await sut.execute({
      requestId: request.id.toString(),
      authorId: 'assigned-1',
      content: longComment,
    });

    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('...'),
      }),
    );
  });
});
