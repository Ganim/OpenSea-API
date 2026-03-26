import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { queueGenerateInsights, getAiGenerateInsightsQueue } from './queues/ai';

// Run every 24 hours
const INSIGHT_GENERATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

let insightIntervalId: ReturnType<typeof setInterval> | null = null;

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Fetches all tenants that have proactive insights enabled.
 */
async function getTenantsWithProactiveInsights() {
  return prisma.aiTenantConfig.findMany({
    where: {
      enableProactiveInsights: true,
      tenant: {
        status: 'ACTIVE',
        deletedAt: null,
      },
    },
    select: {
      tenantId: true,
    },
  });
}

/**
 * Enqueues insight generation jobs for all eligible tenants.
 */
async function scheduleInsightGeneration() {
  try {
    const configs = await getTenantsWithProactiveInsights();
    const queue = getAiGenerateInsightsQueue();

    for (const config of configs) {
      const jobId = `ai-insights-${config.tenantId}`;
      const existing = await queue.getJob(jobId);

      if (existing) {
        const state = await existing.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          continue;
        }
        await existing.remove().catch((err) => {
          logger.warn(
            { err, jobId },
            'Failed to remove existing insight generation job',
          );
        });
      }

      await queueGenerateInsights({ tenantId: config.tenantId }, { jobId });
    }

    consecutiveErrors = 0;

    if (configs.length > 0) {
      logger.info(
        { count: configs.length },
        'Scheduled AI insight generation jobs',
      );
    }
  } catch (err) {
    consecutiveErrors++;
    logger.error(
      { err, consecutiveErrors, maxErrors: MAX_CONSECUTIVE_ERRORS },
      'Failed to schedule AI insight generation jobs',
    );
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `AI insight scheduler stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive failures`,
      );
      stopInsightScheduler();
    }
  }
}

/**
 * Initializes the AI insight scheduler.
 * Runs an initial pass, then sets up a recurring interval every 24 hours.
 * Call this from the workers entrypoint (index.ts).
 */
export async function initInsightScheduler(): Promise<void> {
  // Initial pass
  await scheduleInsightGeneration();

  // Set up recurring interval
  insightIntervalId = setInterval(
    scheduleInsightGeneration,
    INSIGHT_GENERATION_INTERVAL_MS,
  );

  logger.info(
    { intervalMs: INSIGHT_GENERATION_INTERVAL_MS },
    'AI insight scheduler started successfully',
  );
}

/**
 * Stops the AI insight scheduler.
 */
export function stopInsightScheduler(): void {
  if (insightIntervalId) {
    clearInterval(insightIntervalId);
    insightIntervalId = null;
  }
  logger.info('AI insight scheduler stopped');
}
