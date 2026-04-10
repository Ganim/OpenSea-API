import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { v1DeletePrintAgentController } from './v1-delete-print-agent.controller';
import { v1ListPrintAgentsController } from './v1-list-print-agents.controller';
import { v1RegenerateAgentKeyController } from './v1-regenerate-agent-key.controller';
import { v1RegisterPrintAgentController } from './v1-register-print-agent.controller';

export async function printAgentsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1RegisterPrintAgentController);
  await app.register(v1ListPrintAgentsController);
  await app.register(v1DeletePrintAgentController);
  await app.register(v1RegenerateAgentKeyController);
}
