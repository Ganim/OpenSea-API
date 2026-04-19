import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import { NotificationPriority } from '@/modules/notifications/public';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { RequestNotifier } from './helpers/request-notifier';

interface RequestInfoUseCaseRequest {
  requestId: string;
  requestedById: string;
  infoRequested: string;
}

interface RequestInfoUseCaseResponse {
  success: boolean;
}

export class RequestInfoUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private notifier: RequestNotifier,
  ) {}

  async execute(
    data: RequestInfoUseCaseRequest,
  ): Promise<RequestInfoUseCaseResponse> {
    const request = await this.requestsRepository.findById(
      new UniqueEntityID(data.requestId),
    );

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    if (request.assignedToId?.toString() !== data.requestedById) {
      throw new ForbiddenError(
        'Only the assigned user can request additional information',
      );
    }

    try {
      request.requestInfo();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(
          'Can only request info from in-progress requests',
        )
      ) {
        throw new BadRequestError(
          'Can only request additional information from in-progress requests',
        );
      }
      throw error;
    }

    await this.requestsRepository.save(request);

    const history = RequestHistory.create({
      requestId: request.id,
      action: 'info_requested',
      description: data.infoRequested,
      performedById: new UniqueEntityID(data.requestedById),
      oldValue: { status: 'IN_PROGRESS' },
      newValue: { status: 'PENDING_INFO' },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    await this.notifier.dispatch({
      recipientUserId: request.requesterId.toString(),
      category: 'requests.info_requested',
      request,
      title: 'Informações adicionais solicitadas',
      body: `Foram solicitadas informações adicionais para "${request.title}": ${data.infoRequested}`,
      priorityOverride: NotificationPriority.HIGH,
      actionText: 'Fornecer informações',
    });

    return { success: true };
  }
}
