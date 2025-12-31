import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

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
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    data: AssignRequestUseCaseRequest,
  ): Promise<AssignRequestUseCaseResponse> {
    if (!data.hasAssignPermission) {
      throw new ForbiddenError('You do not have permission to assign requests');
    }

    const request = await this.requestsRepository.findById({
      toString: () => data.requestId,
    } as UniqueEntityID);

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      throw new BadRequestError('Cannot assign completed or cancelled request');
    }

    const oldAssignedToId = request.assignedToId?.toString();

    request.assign(new UniqueEntityID(data.assignedToId));

    await this.requestsRepository.save(request);

    // Registrar histórico
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

    // Notificar atribuído
    await this.createNotificationUseCase.execute({
      userId: data.assignedToId,
      title: 'Requisição Atribuída',
      message: `Uma requisição foi atribuída a você: ${request.title}`,
      type: 'INFO',
      priority: request.priority === 'URGENT' ? 'HIGH' : 'NORMAL',
      channel: 'IN_APP',
      entityType: 'REQUEST',
      entityId: request.id.toString(),
      actionUrl: `/requests/${request.id.toString()}`,
      actionText: 'Ver Requisição',
    });

    return { success: true };
  }
}
