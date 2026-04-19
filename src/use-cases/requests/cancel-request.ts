import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { RequestNotifier } from './helpers/request-notifier';

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
    private notifier: RequestNotifier,
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

    const isRequester = request.requesterId.toString() === data.cancelledById;

    if (!isRequester && !data.hasCancelAllPermission) {
      throw new ForbiddenError(
        'Only the requester or a user with permission can cancel the request',
      );
    }

    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      throw new BadRequestError(
        'Cannot cancel a completed or already cancelled request',
      );
    }

    const oldStatus = request.status;

    request.cancel();

    await this.requestsRepository.save(request);

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

    const body = `A solicitação "${request.title}" foi cancelada. Motivo: ${data.cancellationReason}`;

    if (request.requesterId.toString() !== data.cancelledById) {
      await this.notifier.dispatch({
        recipientUserId: request.requesterId.toString(),
        category: 'requests.cancelled',
        request,
        title: 'Solicitação cancelada',
        body,
      });
    }

    if (
      request.assignedToId &&
      request.assignedToId.toString() !== data.cancelledById
    ) {
      await this.notifier.dispatch({
        recipientUserId: request.assignedToId.toString(),
        category: 'requests.cancelled',
        request,
        title: 'Solicitação cancelada',
        body,
      });
    }

    return { success: true };
  }
}
