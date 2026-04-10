import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { v1DeletePrintAgentController } from './v1-delete-print-agent.controller';
import { v1GetPairingCodeController } from './v1-get-pairing-code.controller';
import { v1ListPrintAgentsController } from './v1-list-print-agents.controller';
import { v1PairPrintAgentController } from './v1-pair-print-agent.controller';
import { v1RegisterPrintAgentController } from './v1-register-print-agent.controller';
import { v1UnpairPrintAgentController } from './v1-unpair-print-agent.controller';

/**
 * Module-scoped routes (require SALES module + JWT + tenant)
 */
export async function printAgentsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1RegisterPrintAgentController);
  await app.register(v1ListPrintAgentsController);
  await app.register(v1DeletePrintAgentController);
  await app.register(v1GetPairingCodeController);
  await app.register(v1UnpairPrintAgentController);
}

/**
 * Public routes (no JWT, no tenant, no module check).
 * The pairing code is the authentication mechanism.
 */
export async function printAgentsPublicRoutes(app: FastifyInstance) {
  await app.register(v1PairPrintAgentController);
}
