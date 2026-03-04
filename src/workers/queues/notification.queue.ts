import type { Queue } from 'bullmq';
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

// Lazy — fila só é criada na primeira chamada, evitando conexão Redis no boot
let _notificationQueue: Queue<NotificationJobData> | null = null;

function getNotificationQueue(): Queue<NotificationJobData> {
  if (!_notificationQueue) {
    _notificationQueue = createQueue<NotificationJobData>(
      QUEUE_NAMES.NOTIFICATIONS,
    );
  }
  return _notificationQueue;
}

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
  return getNotificationQueue().add(QUEUE_NAMES.NOTIFICATIONS, data, {
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
