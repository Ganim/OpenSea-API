import { PermissionCodes } from '@/constants/rbac';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makePreviewRollbackUseCase } from '@/use-cases/audit/factories/make-preview-rollback-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function previewRollbackController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/audit-logs/rollback/preview/:entity/:entityId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.AUDIT.ROLLBACK.PREVIEW,
        resource: 'audit-logs',
      }),
    ],
    schema: {
      tags: ['Core - Audit'],
      summary: 'Preview rollback for an entity',
      params: z.object({
        entity: z.nativeEnum(AuditEntity),
        entityId: z.string(),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { entity, entityId } = request.params;

      const previewRollbackUseCase = makePreviewRollbackUseCase();
      const result = await previewRollbackUseCase.execute({
        entity,
        entityId,
      });

      return reply.status(200).send(result);
    },
  });
}
