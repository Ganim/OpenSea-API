import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  validateStageTransitionSchema,
  validateStageTransitionResponseSchema,
} from '@/http/schemas/sales/blueprints';
import { makeValidateStageTransitionUseCase } from '@/use-cases/sales/blueprints/factories/make-validate-stage-transition-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function validateStageTransitionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/blueprints/validate-transition',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BLUEPRINTS.ACCESS,
        resource: 'blueprints',
      }),
    ],
    schema: {
      tags: ['Sales - Blueprints'],
      summary: 'Validate a deal stage transition against blueprint rules',
      description:
        'Checks if a deal meets all required fields and validations to move to a target stage',
      body: validateStageTransitionSchema,
      response: {
        200: validateStageTransitionResponseSchema,
        404: validateStageTransitionResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { dealId, targetStageId } = request.body;

      const useCase = makeValidateStageTransitionUseCase();
      const { valid, errors } = await useCase.execute({
        tenantId,
        dealId,
        targetStageId,
      });

      return reply.status(200).send({ valid, errors });
    },
  });
}
