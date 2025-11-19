import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

interface ProvideInfoUseCaseRequest {
  requestId: string;
  providedById: string;
  informationProvided: string;
}

interface ProvideInfoUseCaseResponse {
  success: boolean;
}

export class ProvideInfoUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    data: ProvideInfoUseCaseRequest,
  ): Promise<ProvideInfoUseCaseResponse> {
    const request = await this.requestsRepository.findById(
      new UniqueEntityID(data.requestId),
    );

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    // Verificar se o usuário é o solicitante
    if (request.requesterId.toString() !== data.providedById) {
      throw new ForbiddenError(
        'Only the requester can provide additional information',
      );
    }

    // Fornecer informação
    try {
      request.provideInfo();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(
          'Can only provide info for pending-info requests',
        )
      ) {
        throw new BadRequestError(
          'Can only provide information for requests that are pending additional info',
        );
      }
      throw error;
    }

    await this.requestsRepository.save(request);

    // Registrar histórico
    const history = RequestHistory.create({
      requestId: request.id,
      action: 'info_provided',
      description: data.informationProvided,
      performedById: new UniqueEntityID(data.providedById),
      oldValue: { status: 'PENDING_INFO' },
      newValue: { status: 'SUBMITTED' },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    // Notificar o atribuído se existir
    if (request.assignedToId) {
      await this.createNotificationUseCase.execute({
        userId: request.assignedToId.toString(),
        title: 'Information Provided',
        message: `Additional information provided for "${request.title}": ${data.informationProvided}`,
        type: 'INFO',
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
