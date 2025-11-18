import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { faker } from '@faker-js/faker';

export async function makeNotification(params: { userId: string; type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'REMINDER'; channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'; priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'; }) {
  const useCase = makeCreateNotificationUseCase();
  const { notification } = await useCase.execute({
    userId: params.userId,
    title: faker.lorem.sentence(5),
    message: faker.lorem.paragraph(),
    type: params.type ?? 'INFO',
    channel: params.channel ?? 'IN_APP',
    priority: params.priority ?? 'NORMAL',
  });
  return notification;
}
