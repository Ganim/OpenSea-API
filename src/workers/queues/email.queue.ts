import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

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

// Cria a fila de emails
export const emailQueue = createQueue<EmailJobData>(QUEUE_NAMES.EMAILS);

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
  return emailQueue.add(QUEUE_NAMES.EMAILS, data, {
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Inicia o worker de processamento de emails
 */
export function startEmailWorker() {
  return createWorker<EmailJobData>(
    QUEUE_NAMES.EMAILS,
    async (job: Job<EmailJobData>) => {
      const { to, subject, html, text } = job.data;

      console.log(`[EmailWorker] Processing email to: ${to}, subject: ${subject}`);

      // TODO: Implementar envio real com nodemailer
      // Por enquanto, apenas loga
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({...});

      console.log(`[EmailWorker] Email sent successfully to: ${to}`);
    },
    {
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000, // 10 emails por segundo
      },
    },
  );
}
