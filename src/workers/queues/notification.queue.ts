import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  metadata?: Record<string, unknown>;
}

// Cria a fila de notificações
export const notificationQueue = createQueue<NotificationJobData>(
  QUEUE_NAMES.NOTIFICATIONS,
);

/**
 * Adiciona uma notificação à fila
 */
export async function queueNotification(
  data: NotificationJobData,
  options?: {
    delay?: number;
    priority?: number;
  },
) {
  return notificationQueue.add(QUEUE_NAMES.NOTIFICATIONS, data, {
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Agenda uma notificação para um horário específico
 */
export async function scheduleNotification(
  data: NotificationJobData,
  scheduledFor: Date,
) {
  const delay = scheduledFor.getTime() - Date.now();

  if (delay <= 0) {
    // Se já passou, envia imediatamente
    return queueNotification(data);
  }

  return queueNotification(data, { delay });
}

/**
 * Inicia o worker de processamento de notificações
 */
export function startNotificationWorker() {
  return createWorker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job: Job<NotificationJobData>) => {
      const { userId, title, type: _type } = job.data;

      console.log(
        `[NotificationWorker] Processing notification for user: ${userId}, title: ${title}`,
      );

      // TODO: Implementar criação real da notificação no banco
      // await prisma.notification.create({
      //   data: {
      //     userId,
      //     title,
      //     message: job.data.message,
      //     type,
      //     link: job.data.link,
      //   },
      // });

      console.log(
        `[NotificationWorker] Notification created for user: ${userId}`,
      );
    },
    {
      concurrency: 10,
      limiter: {
        max: 50,
        duration: 1000, // 50 notificações por segundo
      },
    },
  );
}
