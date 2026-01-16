import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { env } from '@/@env';
import { getRedisClient } from './redis';

// Configuração de conexão para o BullMQ
const getConnection = () => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
});

// Opções padrão para jobs
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
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
const queueEvents = new Map<string, QueueEvents>();

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

  queues.set(name, queue);

  // Cria eventos para monitoramento
  const events = new QueueEvents(name, {
    connection: getConnection(),
  });
  queueEvents.set(name, events);

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

  worker.on('failed', (job, err) => {
    console.error(`[Queue:${name}] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
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
 * Fecha todas as filas e workers graciosamente
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const worker of workers.values()) {
    closePromises.push(worker.close());
  }

  for (const queue of queues.values()) {
    closePromises.push(queue.close());
  }

  for (const events of queueEvents.values()) {
    closePromises.push(events.close());
  }

  await Promise.all(closePromises);

  workers.clear();
  queues.clear();
  queueEvents.clear();

  console.log('[Queue] All queues and workers closed');
}

// Nomes das filas disponíveis
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  AUDIT_LOGS: 'audit-logs',
  REPORTS: 'reports',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
