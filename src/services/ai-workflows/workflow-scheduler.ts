import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { PrismaAiWorkflowExecutionsRepository } from '@/repositories/ai/prisma/prisma-ai-workflow-executions-repository';
import { makeToolRegistry } from '@/services/ai-tools/make-tool-registry';
import { ToolUseCaseFactory } from '@/services/ai-tools/tool-use-case-factory';
import { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { ExecuteWorkflowUseCase } from '@/use-cases/ai/workflows/execute-workflow';

/**
 * Simple in-process workflow scheduler.
 * Checks every 60 seconds for CRON workflows that need to run.
 * Uses setInterval — no external dependencies.
 */
export class WorkflowScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly CHECK_INTERVAL_MS = 60_000; // 1 minute

  /**
   * Start the scheduler. Checks every minute for due CRON workflows.
   */
  start(): void {
    if (this.intervalId) {
      console.log('[WorkflowScheduler] Already running');
      return;
    }

    console.log('[WorkflowScheduler] Starting (interval: 60s)');

    this.intervalId = setInterval(() => {
      this.tick().catch((err) => {
        console.error('[WorkflowScheduler] Tick error:', err);
      });
    }, this.CHECK_INTERVAL_MS);

    // Run immediately on start
    this.tick().catch((err) => {
      console.error('[WorkflowScheduler] Initial tick error:', err);
    });
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[WorkflowScheduler] Stopped');
    }
  }

  /**
   * Single tick: find and execute due CRON workflows.
   */
  private async tick(): Promise<void> {
    if (this.isRunning) {
      return; // Skip if previous tick still running
    }

    this.isRunning = true;

    try {
      const workflowsRepo = new PrismaAiWorkflowsRepository();
      const cronWorkflows = await workflowsRepo.findAllActiveByTrigger('CRON');

      if (cronWorkflows.length === 0) {
        return;
      }

      const now = new Date();

      for (const workflow of cronWorkflows) {
        try {
          const cronExpression = (
            workflow.triggerConfig as { cronExpression?: string } | null
          )?.cronExpression;

          if (!cronExpression) {
            continue;
          }

          // Check if this workflow is due to run
          if (!this.isDue(cronExpression, workflow.lastRunAt, now)) {
            continue;
          }

          console.log(
            `[WorkflowScheduler] Running workflow "${workflow.name}" (${workflow.id.toString()})`,
          );

          const executionsRepo = new PrismaAiWorkflowExecutionsRepository();
          const toolRegistry = makeToolRegistry();
          const toolFactory = new ToolUseCaseFactory();
          const toolExecutor = new ToolExecutor(toolRegistry, toolFactory);

          const executeUseCase = new ExecuteWorkflowUseCase(
            workflowsRepo,
            executionsRepo,
            toolExecutor,
          );

          await executeUseCase.execute({
            workflowId: workflow.id.toString(),
            tenantId: workflow.tenantId.toString(),
            userId: workflow.userId.toString(),
            trigger: 'CRON',
            userPermissions: [], // CRON runs with no user permissions
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `[WorkflowScheduler] Error executing workflow ${workflow.id.toString()}: ${msg}`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Simple cron-like check: determines if a workflow is due based on a
   * simplified cron expression and the last run time.
   *
   * Supports: "every N minutes", "every N hours", "daily", "weekly"
   * Format: standard 5-field cron (minute hour day-of-month month day-of-week)
   *
   * For simplicity, we compute the interval in milliseconds from the cron
   * expression and check if enough time has passed since lastRunAt.
   */
  private isDue(
    cronExpression: string,
    lastRunAt: Date | null,
    now: Date,
  ): boolean {
    const intervalMs = this.cronToIntervalMs(cronExpression);

    if (intervalMs <= 0) {
      return false;
    }

    if (!lastRunAt) {
      return true; // Never run before
    }

    const elapsed = now.getTime() - lastRunAt.getTime();
    return elapsed >= intervalMs;
  }

  /**
   * Convert a simplified cron expression to an interval in milliseconds.
   * Handles common patterns:
   *   "* /5 * * * *"  -> every 5 minutes
   *   "0 * * * *"     -> every hour
   *   "0 0 * * *"     -> daily
   *   "0 0 * * 0"     -> weekly
   */
  private cronToIntervalMs(cron: string): number {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) return 0;

    const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

    // Every N minutes: "* /N * * * *" or "*/N * * * *"
    if (minute.includes('/')) {
      const interval = parseInt(minute.split('/')[1], 10);
      if (!isNaN(interval) && interval > 0) {
        return interval * 60 * 1000;
      }
    }

    // Every hour: "0 * * * *"
    if (
      minute !== '*' &&
      hour === '*' &&
      dayOfMonth === '*' &&
      dayOfWeek === '*'
    ) {
      return 60 * 60 * 1000;
    }

    // Daily: "0 0 * * *" or "N N * * *"
    if (
      minute !== '*' &&
      hour !== '*' &&
      dayOfMonth === '*' &&
      dayOfWeek === '*'
    ) {
      return 24 * 60 * 60 * 1000;
    }

    // Weekly: "0 0 * * N"
    if (
      minute !== '*' &&
      hour !== '*' &&
      dayOfMonth === '*' &&
      dayOfWeek !== '*'
    ) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    // Default: treat as hourly
    return 60 * 60 * 1000;
  }
}

// Singleton
let schedulerInstance: WorkflowScheduler | null = null;

export function getWorkflowScheduler(): WorkflowScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new WorkflowScheduler();
  }
  return schedulerInstance;
}
