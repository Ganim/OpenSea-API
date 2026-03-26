import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { approveProposalController } from './v1-approve-proposal.controller';
import { createProposalController } from './v1-create-proposal.controller';
import { deleteProposalController } from './v1-delete-proposal.controller';
import { duplicateProposalController } from './v1-duplicate-proposal.controller';
import { getProposalByIdController } from './v1-get-proposal-by-id.controller';
import { listProposalsController } from './v1-list-proposals.controller';
import { rejectProposalController } from './v1-reject-proposal.controller';
import { sendProposalController } from './v1-send-proposal.controller';
import { updateProposalController } from './v1-update-proposal.controller';

export async function proposalsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listProposalsController);
  await app.register(getProposalByIdController);
  await app.register(createProposalController);
  await app.register(updateProposalController);
  await app.register(deleteProposalController);
  await app.register(sendProposalController);
  await app.register(approveProposalController);
  await app.register(rejectProposalController);
  await app.register(duplicateProposalController);
}
