import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Notification,
  NotificationChannelValue,
  NotificationPriorityValue,
} from '@/entities/notifications/notification';
import type { NotificationTemplatesRepository } from '@/repositories/notifications/notification-templates-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

function interpolate(
  template: string,
  variables: Record<string, string | number>,
) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    variables[key] !== undefined ? String(variables[key]) : '',
  );
}

interface CreateFromTemplateUseCaseRequest {
  templateCode: string;
  userId: string;
  variables?: Record<string, string | number>;
  channel?: NotificationChannelValue;
  priority?: NotificationPriorityValue;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  scheduledFor?: Date;
}

interface CreateFromTemplateUseCaseResponse {
  notification: Notification;
}

export class CreateFromTemplateUseCase {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private templatesRepository: NotificationTemplatesRepository,
  ) {}

  async execute(
    params: CreateFromTemplateUseCaseRequest,
  ): Promise<CreateFromTemplateUseCaseResponse> {
    const template = await this.templatesRepository.findByCode(
      params.templateCode,
    );

    if (!template || template.isDeleted || !template.isActive) {
      throw new Error('Template not found or inactive');
    }

    const vars = params.variables ?? {};
    const title = interpolate(template.titleTemplate, vars);
    const message = interpolate(template.messageTemplate, vars);

    const notification = await this.notificationsRepository.create({
      userId: new UniqueEntityID(params.userId),
      title,
      message,
      type: 'INFO',
      priority: params.priority ?? template.defaultPriority,
      channel: params.channel ?? template.defaultChannel,
      actionUrl: params.actionUrl,
      actionText: params.actionText,
      entityType: params.entityType,
      entityId: params.entityId,
      scheduledFor: params.scheduledFor,
    });

    return { notification };
  }
}
