import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { verifyAuditRollbackPreviewPermission } from '@/http/middlewares/verify-audit-permission';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makePreviewRollbackUseCase } from '@/use-cases/audit/factories/make-preview-rollback-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function previewRollbackController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/audit-logs/rollback/preview/:entity/:entityId',
    preHandler: [verifyJwt, verifyAuditRollbackPreviewPermission],
    schema: {
      tags: ['Audit'],
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
