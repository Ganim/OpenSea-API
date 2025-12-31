import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeCompareVersionsUseCase } from '@/use-cases/audit/factories/make-compare-versions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function compareVersionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/audit-logs/compare/:entity/:entityId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.AUDIT.COMPARE.VIEW,
        resource: 'audit-logs',
      }),
    ],
    schema: {
      tags: ['Core - Audit'],
      summary: 'Compare two versions of an entity',
      params: z.object({
        entity: z.nativeEnum(AuditEntity),
        entityId: z.string(),
      }),
      querystring: z.object({
        v1: z.coerce
          .number()
          .int()
          .positive({ message: 'Version numbers must be positive integers' }),
        v2: z.coerce
          .number()
          .int()
          .positive({ message: 'Version numbers must be positive integers' }),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { entity, entityId } = request.params;
      const { v1, v2 } = request.query;

      try {
        const compareVersionsUseCase = makeCompareVersionsUseCase();
        const result = await compareVersionsUseCase.execute({
          entity,
          entityId,
          version1: v1,
          version2: v2,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
