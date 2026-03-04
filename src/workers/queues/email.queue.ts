import type { Queue } from 'bullmq';
import { createQueue, QUEUE_NAMES } from '@/lib/queue';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  metadata?: Record<string, unknown>;
}

// Lazy — fila só é criada na primeira chamada, evitando conexão Redis no boot
let _emailQueue: Queue<EmailJobData> | null = null;

function getEmailQueue(): Queue<EmailJobData> {
  if (!_emailQueue) {
    _emailQueue = createQueue<EmailJobData>(QUEUE_NAMES.EMAILS);
  }
  return _emailQueue;
}

/**
 * Adiciona um email à fila para envio
 */
export async function queueEmail(
  data: EmailJobData,
  options?: {
    delay?: number;
    priority?: number;
  },
) {
  return getEmailQueue().add(QUEUE_NAMES.EMAILS, data, {
    delay: options?.delay,
    priority: options?.priority,
  });
}
