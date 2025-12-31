import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateRequestDTO } from '@/entities/requests/dtos/request-dtos';
import { Request } from '@/entities/requests/request';
import { RequestHistory } from '@/entities/requests/request-history';
import type { RequestHistoryRepository } from '@/repositories/requests/request-history-repository';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

type CreateRequestUseCaseRequest = CreateRequestDTO;

interface CreateRequestUseCaseResponse {
  request: Request;
}

export class CreateRequestUseCase {
  constructor(
    private requestsRepository: RequestsRepository,
    private requestHistoryRepository: RequestHistoryRepository,
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    data: CreateRequestUseCaseRequest,
  ): Promise<CreateRequestUseCaseResponse> {
    // Calcular SLA deadline (exemplo: 5 dias úteis)
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

    // Registrar histórico
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

    // Notificar destinatário
    await this.notifyTarget(request);

    return { request };
  }

  private calculateSLADeadline(businessDays: number): Date {
    const date = new Date();
    let addedDays = 0;

    while (addedDays < businessDays) {
      date.setDate(date.getDate() + 1);
      // Pular fins de semana
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return date;
  }

  private async notifyTarget(request: Request): Promise<void> {
    let targetUserIds: string[] = [];

    if (request.targetType === 'USER' && request.targetId) {
      targetUserIds = [request.targetId];
    }
    // TODO: Implementar lógica para GROUP quando disponível

    for (const userId of targetUserIds) {
      await this.createNotificationUseCase.execute({
        userId,
        title: 'Nova Requisição',
        message: `Você recebeu uma nova requisição: ${request.title}`,
        type: 'INFO',
        priority: request.priority === 'URGENT' ? 'HIGH' : 'NORMAL',
        channel: 'IN_APP',
        entityType: 'REQUEST',
        entityId: request.id.toString(),
        actionUrl: `/requests/${request.id.toString()}`,
        actionText: 'Ver Requisição',
      });
    }
  }
}
