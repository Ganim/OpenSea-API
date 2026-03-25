import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workflowIdParamsSchema } from '@/http/schemas/ai';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeExecuteWorkflowUseCase } from '@/use-cases/ai/workflows/factories/make-execute-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function runWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/workflows/:id/run',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'Manually trigger a workflow execution',
      security: [{ bearerAuth: [] }],
      params: workflowIdParamsSchema,
      response: {
        200: z.object({
          executionId: z.string(),
          status: z.string(),
          results: z.any().optional(),
          error: z.string().optional(),
          skipped: z.boolean().optional(),
          reason: z.string().optional(),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissionCodes(
        new UniqueEntityID(userId),
      );

      const useCase = makeExecuteWorkflowUseCase();
      const result = await useCase.execute({
        workflowId: request.params.id,
        tenantId,
        userId,
        trigger: 'MANUAL',
        userPermissions,
      });

      return reply.status(200).send(result);
    },
  });
}
