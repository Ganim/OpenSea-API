import { prisma } from '@/lib/prisma';
import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { InsightGenerator } from './insight-generator';

/**
 * Periodically generates proactive insights for tenants that have
 * `enableProactiveInsights: true` in their AiTenantConfig.
 *
 * Uses setInterval — no external dependencies.
 */
export class InsightScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly CHECK_INTERVAL_MS: number;

  constructor(intervalMs?: number) {
    // Default: 6 hours
    this.CHECK_INTERVAL_MS = intervalMs ?? 6 * 60 * 60 * 1000;
  }

  /**
   * Start the scheduler.
   */
  start(): void {
    if (this.intervalId) {
      console.log('[InsightScheduler] Already running');
      return;
    }

    const hours = (this.CHECK_INTERVAL_MS / (1000 * 60 * 60)).toFixed(1);
    console.log(`[InsightScheduler] Starting (interval: ${hours}h)`);

    this.intervalId = setInterval(() => {
      this.tick().catch((err) => {
        console.error('[InsightScheduler] Tick error:', err);
      });
    }, this.CHECK_INTERVAL_MS);

    // Run immediately on start
    this.tick().catch((err) => {
      console.error('[InsightScheduler] Initial tick error:', err);
    });
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[InsightScheduler] Stopped');
    }
  }

  /**
   * Single tick: find all tenants with proactive insights enabled and
   * generate insights for each.
   */
  private async tick(): Promise<void> {
    if (this.isRunning) {
      return; // Skip if previous tick still running
    }

    this.isRunning = true;

    try {
      // Find all tenant configs with proactive insights enabled
      const configs = await prisma.aiTenantConfig.findMany({
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

      if (configs.length === 0) {
        return;
      }

      console.log(`[InsightScheduler] Processing ${configs.length} tenant(s)`);

      const insightsRepo = new PrismaAiInsightsRepository();
      const generator = new InsightGenerator(insightsRepo);

      for (const config of configs) {
        try {
          // Get all user IDs for this tenant
          const tenantUsers = await prisma.tenantUser.findMany({
            where: {
              tenantId: config.tenantId,
              deletedAt: null,
            },
            select: { userId: true },
          });

          const targetUserIds = tenantUsers.map((tu) => tu.userId);

          if (targetUserIds.length === 0) {
            continue;
          }

          const result = await generator.generate(
            config.tenantId,
            targetUserIds,
          );

          if (result.generated > 0 || result.errors.length > 0) {
            console.log(
              `[InsightScheduler] Tenant ${config.tenantId}: generated=${result.generated}, skipped=${result.skippedDuplicates}, errors=${result.errors.length}`,
            );
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `[InsightScheduler] Error processing tenant ${config.tenantId}: ${msg}`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}

// Singleton
let schedulerInstance: InsightScheduler | null = null;

export function getInsightScheduler(): InsightScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new InsightScheduler();
  }
  return schedulerInstance;
}
