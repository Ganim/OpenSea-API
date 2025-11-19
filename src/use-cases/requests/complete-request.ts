import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

interface CompleteRequestUseCaseRequest {
  requestId: string;
  completedById: string;
  completionNotes?: string;
}

interface CompleteRequestUseCaseResponse {
  success: boolean;
}

export class CompleteRequestUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    data: CompleteRequestUseCaseRequest,
  ): Promise<CompleteRequestUseCaseResponse> {
    const request = await this.requestsRepository.findById(
      new UniqueEntityID(data.requestId),
    );

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    // Verificar se o usuário é o atribuído
    if (request.assignedToId?.toString() !== data.completedById) {
      throw new ForbiddenError('Only assigned user can complete the request');
    }

    // Completar a requisição
    request.complete();

    await this.requestsRepository.save(request);

    // Registrar histórico
    const history = RequestHistory.create({
      requestId: request.id,
      action: 'completed',
      description: data.completionNotes ?? 'Requisição concluída',
      performedById: new UniqueEntityID(data.completedById),
      oldValue: { status: 'IN_PROGRESS' },
      newValue: { status: 'COMPLETED' },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    // Notificar o solicitante
    await this.createNotificationUseCase.execute({
      userId: request.requesterId.toString(),
      title: 'Request Completed',
      message: `Your request "${request.title}" has been completed.`,
      type: 'SUCCESS',
      priority: 'NORMAL',
      channel: 'IN_APP',
      entityType: 'REQUEST',
      entityId: request.id.toString(),
      actionUrl: `/requests/${request.id.toString()}`,
      actionText: 'View Request',
    });

    return { success: true };
  }
}
