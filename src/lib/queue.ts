import { env } from '@/@env';
import { captureMessage } from '@/lib/sentry';
import { Job, Queue, Worker } from 'bullmq';

// Configuração de conexão para o BullMQ
// IMPORTANTE: maxRetriesPerRequest DEVE ser null — BullMQ usa blocking commands (BRPOPLPUSH)
// que não são compatíveis com retry automático do ioredis.
const getConnection = () => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  tls: env.REDIS_TLS ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    return Math.min(times * 200, 5000);
  },
});

// Opções padrão para jobs
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: {
    count: 1000, // Mantém últimos 1000 jobs completos
    age: 24 * 60 * 60, // Remove após 24h
  },
  removeOnFail: {
    count: 5000, // Mantém últimos 5000 jobs falhos
    age: 7 * 24 * 60 * 60, // Remove após 7 dias
  },
};

// Store para manter referência das filas e workers
const queues = new Map<string, Queue>();
const workers = new Map<string, Worker>();

/**
 * Cria uma nova fila
 */
export function createQueue<T = unknown>(name: string): Queue<T> {
  if (queues.has(name)) {
    return queues.get(name) as Queue<T>;
  }

  const queue = new Queue<T>(name, {
    connection: getConnection(),
    defaultJobOptions,
  });

  queue.on('error', (err) => {
    console.error(`[Queue:${name}] Connection error:`, err.message);
  });

  queues.set(name, queue);

  return queue;
}

/**
 * Cria um worker para processar jobs de uma fila
 */
export function createWorker<T = unknown>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  options: {
    concurrency?: number;
    limiter?: {
      max: number;
      duration: number;
    };
  } = {},
): Worker<T> {
  if (workers.has(name)) {
    return workers.get(name) as Worker<T>;
  }

  const worker = new Worker<T>(name, processor, {
    connection: getConnection(),
    concurrency: options.concurrency || 5,
    limiter: options.limiter || {
      max: 100,
      duration: 1000, // 100 jobs por segundo
    },
  });

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[Queue:${name}] Job ${job.id} completed`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`[Queue:${name}] Job ${job?.id} failed:`, err.message);

    // Dead Letter Queue: if all retries exhausted, forward to DLQ
    if (
      job &&
      job.attemptsMade >= (job.opts?.attempts ?? defaultJobOptions.attempts)
    ) {
      try {
        const dlq = createQueue(QUEUE_NAMES.DEAD_LETTER);
        await dlq.add('dead-letter', {
          originalQueue: name,
          originalJobId: job.id,
          originalJobName: job.name,
          data: job.data,
          lastError: err.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade,
        });
        console.error(
          `[DLQ] Job ${job.id} from queue "${name}" moved to dead-letter after ${job.attemptsMade} attempts`,
        );
        captureMessage(`DLQ: Job failed permanently in "${name}"`, 'warning', {
          queue: name,
          jobId: job.id,
          error: err.message,
          attempts: job.attemptsMade,
        });
      } catch (dlqErr) {
        console.error(`[DLQ] Failed to enqueue dead letter:`, dlqErr);
      }
    }
  });

  worker.on('error', (err) => {
    // Workers emitem 'error' em desconexões Redis — isso é esperado e recuperável.
    // BullMQ reconecta automaticamente. NÃO propagar para unhandledRejection.
    console.error(`[Queue:${name}] Worker error:`, err.message);
  });

  workers.set(name, worker);

  return worker;
}

/**
 * Adiciona um job a uma fila
 */
export async function addJob<T = unknown>(
  queueName: string,
  data: T,
  options?: {
    jobId?: string;
    delay?: number;
    priority?: number;
    repeat?: {
      pattern?: string; // Cron pattern
      every?: number; // Milliseconds
      limit?: number;
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Job<T, any, string>> {
  const queue = createQueue<T>(queueName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = await (queue as any).add(queueName, data, {
    jobId: options?.jobId,
    delay: options?.delay,
    priority: options?.priority,
    repeat: options?.repeat,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return job as Job<T, any, string>;
}

/**
 * Obtém estatísticas de uma fila
 */
export async function getQueueStats(queueName: string) {
  const queue = queues.get(queueName);
  if (!queue) return null;

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    name: queueName,
    counts: {
      waiting,
      active,
      completed,
      failed,
      delayed,
    },
  };
}

/**
 * Obtém estatísticas de todas as filas
 */
export async function getAllQueuesStats() {
  const stats: Record<string, Awaited<ReturnType<typeof getQueueStats>>> = {};

  for (const name of queues.keys()) {
    stats[name] = await getQueueStats(name);
  }

  return stats;
}

/**
 * Retries a dead-letter job by re-adding it to its original queue.
 * Returns true if the job was found and re-queued.
 */
export async function retryDeadLetterJob(jobId: string): Promise<boolean> {
  const dlq = createQueue(QUEUE_NAMES.DEAD_LETTER);
  const job = await dlq.getJob(jobId);

  if (!job) return false;

  const { originalQueue, data } = job.data as {
    originalQueue: string;
    data: unknown;
  };

  const targetQueue = createQueue(originalQueue);
  await targetQueue.add(originalQueue, data);
  await job.remove();

  return true;
}

/**
 * Lists dead-letter jobs (most recent first).
 */
export async function listDeadLetterJobs(limit = 50) {
  const dlq = createQueue(QUEUE_NAMES.DEAD_LETTER);
  const jobs = await dlq.getWaiting(0, limit - 1);
  return jobs.map((job) => ({
    id: job.id,
    ...(job.data as Record<string, unknown>),
  }));
}

/**
 * Fecha todas as filas e workers graciosamente
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const worker of workers.values()) {
    closePromises.push(
      worker.close().then(async () => {
        // BullMQ workers hold their own Redis connection — disconnect it
        const conn = await worker.client;
        conn.disconnect();
      }),
    );
  }

  for (const queue of queues.values()) {
    closePromises.push(
      queue.close().then(async () => {
        const conn = await queue.client;
        conn.disconnect();
      }),
    );
  }

  await Promise.all(closePromises);

  workers.clear();
  queues.clear();

  console.log('[Queue] All queues, workers, and Redis connections closed');
}

// Nomes das filas disponíveis
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  EMAIL_SYNC: 'email-sync',
  AUDIT_LOGS: 'audit-logs',
  REPORTS: 'reports',
  DEAD_LETTER: 'dead-letter',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
