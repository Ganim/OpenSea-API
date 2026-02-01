import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeSelectTenantUseCase } from '@/use-cases/core/tenants/factories/make-select-tenant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function selectTenantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/select-tenant',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Tenants'],
      summary: 'Select a tenant to operate in',
      description:
        'Selects a tenant for the authenticated user and returns a new JWT token that includes the tenantId claim. This token must be used for all subsequent tenant-scoped requests.',
      body: z.object({
        tenantId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          token: z.string(),
          tenant: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
        403: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const sessionId = request.user.sessionId;
      const { tenantId } = request.body;

      try {
        const selectTenantUseCase = makeSelectTenantUseCase();
        const { token, tenant } = await selectTenantUseCase.execute({
          userId,
          tenantId,
          sessionId,
          reply,
        });

        return reply.status(200).send({ token, tenant });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
