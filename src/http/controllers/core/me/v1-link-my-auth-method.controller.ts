import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeLinkAuthMethodUseCase } from '@/use-cases/core/auth/factories/make-link-auth-method-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const providerEnum = z.enum([
  'EMAIL',
  'CPF',
  'ENROLLMENT',
  'GOOGLE',
  'MICROSOFT',
  'APPLE',
  'GITHUB',
]);

const bodySchema = z.object({
  provider: providerEnum,
  identifier: z.string().min(1, 'Identificador é obrigatório'),
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
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

export async function linkMyAuthMethodController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/me/auth-links',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Link a new authentication method to my account',
      security: [{ bearerAuth: [] }],
      body: bodySchema,
      response: {
        201: z.object({ authLink: authLinkSchema }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { provider, identifier, currentPassword } = request.body;

      try {
        const useCase = makeLinkAuthMethodUseCase();
        const { authLink } = await useCase.execute({
          userId: new UniqueEntityID(userId),
          provider,
          identifier,
          currentPassword,
        });

        return reply.status(201).send({ authLink });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
