import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  generateContentBodySchema,
  generateContentResponseSchema,
} from '@/http/schemas/ai/content.schema';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeGenerateContentUseCase } from '@/use-cases/ai/content/factories/make-generate-content-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function generateContentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/content/generate',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Content'],
      summary: 'Generate marketing content using AI',
      security: [{ bearerAuth: [] }],
      body: generateContentBodySchema,
      response: {
        200: generateContentResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissionCodes(
        new UniqueEntityID(userId),
      );

      const useCase = makeGenerateContentUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        userPermissions,
        type: request.body.type,
        context: request.body.context,
      });

      return reply.status(200).send(result);
    },
  });
}
