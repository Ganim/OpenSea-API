import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';
import { prisma } from '@/lib/prisma';
import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { InsightGenerator } from '@/services/ai-insights/insight-generator';
import type { Queue, Job } from 'bullmq';

// ─── Job Data ───────────────────────────────────────────────────────

export interface GenerateInsightsJobData {
  tenantId: string;
}

// ─── Queue Setup ────────────────────────────────────────────────────

const QUEUE_NAME = QUEUE_NAMES.AI_GENERATE_INSIGHTS;

let _queue: Queue<GenerateInsightsJobData> | null = null;

function getQueue(): Queue<GenerateInsightsJobData> {
  if (!_queue) {
    _queue = createQueue<GenerateInsightsJobData>(QUEUE_NAME);
  }
  return _queue;
}

export function getAiGenerateInsightsQueue(): Queue<GenerateInsightsJobData> {
  return getQueue();
}

export async function queueGenerateInsights(
  data: GenerateInsightsJobData,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  },
) {
  return getQueue().add(QUEUE_NAME, data, {
    delay: options?.delay,
    priority: options?.priority,
    jobId: options?.jobId,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 30_000,
    },
  });
}

// ─── Worker ─────────────────────────────────────────────────────────

export function startGenerateInsightsWorker() {
  return createWorker<GenerateInsightsJobData>(
    QUEUE_NAME,
    async (job: Job<GenerateInsightsJobData>) => {
      const { tenantId } = job.data;

      logger.info(
        { jobId: job.id, tenantId },
        'Starting AI insight generation for tenant',
      );

      try {
        const insightsRepository = new PrismaAiInsightsRepository();
        const insightGenerator = new InsightGenerator(insightsRepository);

        // Get all user IDs for this tenant
        const tenantUsers = await prisma.tenantUser.findMany({
          where: {
            tenantId,
            deletedAt: null,
          },
          select: { userId: true },
        });

        const targetUserIds = tenantUsers.map((tu) => tu.userId);

        if (targetUserIds.length === 0) {
          logger.info(
            { jobId: job.id, tenantId },
            'Skipping insight generation — no users in tenant',
          );
          return;
        }

        const generationResult = await insightGenerator.generate(
          tenantId,
          targetUserIds,
        );

        logger.info(
          {
            jobId: job.id,
            tenantId,
            generated: generationResult.generated,
            skippedDuplicates: generationResult.skippedDuplicates,
            errors: generationResult.errors.length,
          },
          'AI insight generation completed',
        );
      } catch (error) {
        logger.error(
          { err: error, jobId: job.id, tenantId },
          'AI insight generation failed',
        );
        throw error;
      }
    },
    {
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 1000,
      },
    },
  );
}
