import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { RequestNotifier } from './helpers/request-notifier';

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
    private notifier: RequestNotifier,
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

    if (request.assignedToId?.toString() !== data.completedById) {
      throw new ForbiddenError('Only assigned user can complete the request');
    }

    request.complete();

    await this.requestsRepository.save(request);

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

    await this.notifier.dispatch({
      recipientUserId: request.requesterId.toString(),
      category: 'requests.completed',
      request,
      title: 'Solicitação concluída',
      body: `Sua solicitação "${request.title}" foi concluída.`,
    });

    return { success: true };
  }
}
