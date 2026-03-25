import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  setupWizardBodySchema,
  setupWizardResponseSchema,
} from '@/http/schemas/ai/setup-wizard.schema';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeSetupWizardUseCase } from '@/use-cases/ai/setup-wizard/factories/make-setup-wizard-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function runSetupWizardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/setup-wizard',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Setup Wizard'],
      summary:
        'Run the AI Setup Wizard to auto-configure the system based on a business description',
      security: [{ bearerAuth: [] }],
      body: setupWizardBodySchema,
      response: {
        200: setupWizardResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissionCodes(
        new UniqueEntityID(userId),
      );

      const useCase = makeSetupWizardUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        userPermissions,
        ...request.body,
      });

      return reply.status(200).send(result);
    },
  });
}
