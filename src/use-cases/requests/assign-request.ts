import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { RequestNotifier } from './helpers/request-notifier';

interface AssignRequestUseCaseRequest {
  requestId: string;
  assignedToId: string;
  performedById: string;
  hasAssignPermission?: boolean;
}

interface AssignRequestUseCaseResponse {
  success: boolean;
}

export class AssignRequestUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private notifier: RequestNotifier,
  ) {}

  async execute(
    data: AssignRequestUseCaseRequest,
  ): Promise<AssignRequestUseCaseResponse> {
    if (!data.hasAssignPermission) {
      throw new ForbiddenError('You do not have permission to assign requests');
    }

    const request = await this.requestsRepository.findById(
      new UniqueEntityID(data.requestId),
    );

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      throw new BadRequestError('Cannot assign completed or cancelled request');
    }

    const oldAssignedToId = request.assignedToId?.toString();

    request.assign(new UniqueEntityID(data.assignedToId));

    await this.requestsRepository.save(request);

    const history = RequestHistory.create({
      requestId: request.id,
      action: 'assigned',
      description: `Requisição atribuída`,
      performedById: new UniqueEntityID(data.performedById),
      oldValue: { assignedToId: oldAssignedToId, status: request.status },
      newValue: {
        assignedToId: data.assignedToId,
        status: request.status,
      },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    await this.notifier.dispatch({
      recipientUserId: data.assignedToId,
      category: oldAssignedToId ? 'requests.reassigned' : 'requests.assigned',
      request,
      title: 'Solicitação atribuída',
      body: request.title,
    });

    return { success: true };
  }
}
