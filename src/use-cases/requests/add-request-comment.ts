import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestComment } from '@/entities/requests/request-comment';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestCommentsRepository } from '@/repositories/requests/request-comments-repository';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

interface AddRequestCommentUseCaseRequest {
  requestId: string;
  authorId: string;
  content: string;
  isInternal?: boolean;
  userRole: 'ADMIN' | 'MANAGER' | 'USER';
}

interface AddRequestCommentUseCaseResponse {
  comment: RequestComment;
}

export class AddRequestCommentUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestCommentsRepository: RequestCommentsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    data: AddRequestCommentUseCaseRequest,
  ): Promise<AddRequestCommentUseCaseResponse> {
    const request = await this.requestsRepository.findById(
      new UniqueEntityID(data.requestId),
    );

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    // Verificar se o usuário pode visualizar/comentar na requisição
    if (!request.canBeViewedBy(data.authorId, data.userRole)) {
      throw new ForbiddenError(
        'You do not have permission to comment on this request',
      );
    }

    const comment = RequestComment.create({
      requestId: new UniqueEntityID(data.requestId),
      authorId: new UniqueEntityID(data.authorId),
      content: data.content,
      isInternal: data.isInternal ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.requestCommentsRepository.create(comment);

    // Registrar histórico
    const history = RequestHistory.create({
      requestId: request.id,
      action: 'comment_added',
      description: `Comment added: ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`,
      performedById: new UniqueEntityID(data.authorId),
      newValue: { commentId: comment.id.toString() },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    // Notificar participantes (solicitante e atribuído, exceto o autor)
    const participantsToNotify = new Set<string>();

    if (request.requesterId.toString() !== data.authorId) {
      participantsToNotify.add(request.requesterId.toString());
    }

    if (
      request.assignedToId &&
      request.assignedToId.toString() !== data.authorId
    ) {
      participantsToNotify.add(request.assignedToId.toString());
    }

    for (const userId of participantsToNotify) {
      await this.createNotificationUseCase.execute({
        userId,
        title: 'New Comment',
        message: `New comment on "${request.title}": ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`,
        type: 'INFO',
        priority: 'NORMAL',
        channel: 'IN_APP',
        entityType: 'REQUEST',
        entityId: request.id.toString(),
        actionUrl: `/requests/${request.id.toString()}#comment-${comment.id.toString()}`,
        actionText: 'View Comment',
      });
    }

    return { comment };
  }
}
