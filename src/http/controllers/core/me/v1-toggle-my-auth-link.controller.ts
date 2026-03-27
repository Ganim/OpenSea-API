import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeToggleAuthLinkStatusUseCase } from '@/use-cases/core/auth/factories/make-toggle-auth-link-status-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

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

export async function toggleMyAuthLinkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/me/auth-links/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Toggle my authentication link status',
      security: [{ bearerAuth: [] }],
      params: paramsSchema,
      body: bodySchema,
      response: {
        200: z.object({ authLink: authLinkSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const { status } = request.body;

      try {
        const useCase = makeToggleAuthLinkStatusUseCase();
        const { authLink } = await useCase.execute({
          authLinkId: new UniqueEntityID(id),
          userId: new UniqueEntityID(userId),
          newStatus: status,
        });

        return reply.status(200).send({ authLink });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
