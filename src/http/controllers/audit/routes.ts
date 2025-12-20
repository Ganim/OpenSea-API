import { env } from '@/@env';
import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { compareVersionsController } from './v1-compare-versions.controller';
import { getEntityHistoryController } from './v1-get-entity-history.controller';
import { listAuditLogsController } from './v1-list-audit-logs.controller';
import { previewRollbackController } from './v1-preview-rollback.controller';

export async function auditRoutes() {
  // Audit routes com rate limit de consulta (todas são queries)
  app.register(
    async (queryApp) => {
      const isTestEnv =
        env.NODE_ENV === 'test' ||
        process.env.VITEST === 'true' ||
        process.env.VITEST === '1';

      if (!isTestEnv) {
        queryApp.register(rateLimit, rateLimitConfig.query);
      }

      queryApp.register(listAuditLogsController);
      queryApp.register(previewRollbackController);
      queryApp.register(getEntityHistoryController);
      queryApp.register(compareVersionsController);
    },
    { prefix: '' },
  );
}
