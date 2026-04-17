import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1CancelContractSignatureController } from './v1-cancel-contract-signature.controller';
import { v1CreateContractTemplateController } from './v1-create-contract-template.controller';
import { v1DeleteContractTemplateController } from './v1-delete-contract-template.controller';
import { v1DownloadContractController } from './v1-download-contract.controller';
import { v1GenerateEmployeeContractController } from './v1-generate-employee-contract.controller';
import { v1GetContractSignatureStatusController } from './v1-get-contract-signature-status.controller';
import { v1GetContractTemplateController } from './v1-get-contract-template.controller';
import { v1ListContractTemplatesController } from './v1-list-contract-templates.controller';
import { v1ListEmployeeContractsController } from './v1-list-employee-contracts.controller';
import { v1RequestContractSignatureController } from './v1-request-contract-signature.controller';
import { v1UpdateContractTemplateController } from './v1-update-contract-template.controller';

export async function contractsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes (rate-limited stricter)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateContractTemplateController);
      mutationApp.register(v1UpdateContractTemplateController);
      mutationApp.register(v1DeleteContractTemplateController);
      mutationApp.register(v1GenerateEmployeeContractController);
      mutationApp.register(v1RequestContractSignatureController);
      mutationApp.register(v1CancelContractSignatureController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListContractTemplatesController);
      queryApp.register(v1GetContractTemplateController);
      queryApp.register(v1ListEmployeeContractsController);
      queryApp.register(v1DownloadContractController);
      queryApp.register(v1GetContractSignatureStatusController);
    },
    { prefix: '' },
  );
}
