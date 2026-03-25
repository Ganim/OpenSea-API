import type { FastifyInstance } from 'fastify';

import { listInsightsController } from './v1-list-insights.controller';
import { viewInsightController } from './v1-view-insight.controller';
import { dismissInsightController } from './v1-dismiss-insight.controller';
import { generateInsightsController } from './v1-generate-insights.controller';

export async function aiInsightsRoutes(app: FastifyInstance) {
  app.register(listInsightsController);
  app.register(viewInsightController);
  app.register(dismissInsightController);
  app.register(generateInsightsController);
}
