import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { RequestNotifier } from './helpers/request-notifier';

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
    private notifier: RequestNotifier,
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

    if (request.requesterId.toString() !== data.providedById) {
      throw new ForbiddenError(
        'Only the requester can provide additional information',
      );
    }

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

    if (request.assignedToId) {
      await this.notifier.dispatch({
        recipientUserId: request.assignedToId.toString(),
        category: 'requests.info_provided',
        request,
        title: 'Informações fornecidas',
        body: `Informações adicionais para "${request.title}": ${data.informationProvided}`,
      });
    }

    return { success: true };
  }
}
