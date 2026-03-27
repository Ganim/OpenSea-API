import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListAuthLinksUseCase } from '@/use-cases/core/auth/factories/make-list-auth-links-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const authLinkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string().nullable(),
  provider: z.string(),
  identifier: z.string(),
  hasCredential: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  status: z.string(),
  linkedAt: z.string(),
  unlinkedAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});

export async function listMyAuthLinksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/auth-links',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'List my authentication links',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          authLinks: z.array(authLinkSchema),
        }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const useCase = makeListAuthLinksUseCase();
      const { authLinks } = await useCase.execute({
        userId: new UniqueEntityID(userId),
      });

      return reply.status(200).send({ authLinks });
    },
  });
}
