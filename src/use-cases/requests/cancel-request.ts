import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

interface CancelRequestUseCaseRequest {
  requestId: string;
  cancelledById: string;
  cancellationReason: string;
  hasCancelAllPermission?: boolean;
}

interface CancelRequestUseCaseResponse {
  success: boolean;
}

export class CancelRequestUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    data: CancelRequestUseCaseRequest,
  ): Promise<CancelRequestUseCaseResponse> {
    const request = await this.requestsRepository.findById(
      new UniqueEntityID(data.requestId),
    );

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    // Verificar permissões: apenas o solicitante ou quem tem permissão de cancelar pode cancelar
    const isRequester = request.requesterId.toString() === data.cancelledById;

    if (!isRequester && !data.hasCancelAllPermission) {
      throw new ForbiddenError(
        'Only the requester or a user with permission can cancel the request',
      );
    }

    // Verificar se a requisição já está finalizada
    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      throw new BadRequestError(
        'Cannot cancel a completed or already cancelled request',
      );
    }

    const oldStatus = request.status;

    // Cancelar a requisição
    request.cancel();

    await this.requestsRepository.save(request);

    // Registrar histórico
    const history = RequestHistory.create({
      requestId: request.id,
      action: 'cancelled',
      description: data.cancellationReason,
      performedById: new UniqueEntityID(data.cancelledById),
      oldValue: { status: oldStatus },
      newValue: { status: 'CANCELLED' },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    // Notificar o solicitante se não foi ele quem cancelou
    if (request.requesterId.toString() !== data.cancelledById) {
      await this.createNotificationUseCase.execute({
        userId: request.requesterId.toString(),
        title: 'Request Cancelled',
        message: `Your request "${request.title}" was cancelled. Reason: ${data.cancellationReason}`,
        type: 'WARNING',
        priority: 'NORMAL',
        channel: 'IN_APP',
        entityType: 'REQUEST',
        entityId: request.id.toString(),
        actionUrl: `/requests/${request.id.toString()}`,
        actionText: 'View Request',
      });
    }

    // Notificar o atribuído se existir
    if (
      request.assignedToId &&
      request.assignedToId.toString() !== data.cancelledById
    ) {
      await this.createNotificationUseCase.execute({
        userId: request.assignedToId.toString(),
        title: 'Request Cancelled',
        message: `The request "${request.title}" was cancelled. Reason: ${data.cancellationReason}`,
        type: 'WARNING',
        priority: 'NORMAL',
        channel: 'IN_APP',
        entityType: 'REQUEST',
        entityId: request.id.toString(),
        actionUrl: `/requests/${request.id.toString()}`,
        actionText: 'View Request',
      });
    }

    return { success: true };
  }
}
