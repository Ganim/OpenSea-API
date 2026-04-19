import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateRequestDTO } from '@/entities/requests/dtos/request-dtos';
import { Request } from '@/entities/requests/request';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { RequestNotifier } from './helpers/request-notifier';

type CreateRequestUseCaseRequest = CreateRequestDTO;

interface CreateRequestUseCaseResponse {
  request: Request;
}

export class CreateRequestUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private notifier: RequestNotifier,
  ) {}

  async execute(
    data: CreateRequestUseCaseRequest,
  ): Promise<CreateRequestUseCaseResponse> {
    const slaDeadline = data.dueDate ?? this.calculateSLADeadline(5);

    const request = Request.create({
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      status: 'SUBMITTED',
      priority: data.priority ?? 'MEDIUM',
      requesterId: new UniqueEntityID(data.requesterId),
      targetType: data.targetType,
      targetId: data.targetId,
      dueDate: data.dueDate,
      slaDeadline,
      metadata: data.metadata ?? {},
      requiresApproval: data.requiresApproval ?? false,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.requestsRepository.create(request);

    const history = RequestHistory.create({
      requestId: request.id,
      action: 'created',
      description: `Requisição criada: ${request.title}`,
      performedById: new UniqueEntityID(data.requesterId),
      newValue: {
        status: request.status,
        priority: request.priority,
        type: request.type,
      },
      createdAt: new Date(),
    });

    await this.requestHistoryRepository.create(history);

    await this.notifyTarget(request);

    return { request };
  }

  private calculateSLADeadline(businessDays: number): Date {
    const date = new Date();
    let addedDays = 0;
    const maxIterations = businessDays * 3 + 10;
    let iterations = 0;

    while (addedDays < businessDays && iterations < maxIterations) {
      date.setDate(date.getDate() + 1);
      iterations++;
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return date;
  }

  private async notifyTarget(request: Request): Promise<void> {
    if (request.targetType !== 'USER' || !request.targetId) return;

    await this.notifier.dispatch({
      recipientUserId: request.targetId,
      category: 'requests.created',
      request,
      title: 'Nova solicitação',
      body: `Você recebeu uma nova solicitação: ${request.title}`,
    });
  }
}
