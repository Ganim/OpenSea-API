import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
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

const paramsSchema = z.object({
  userId: z.uuid(),
});

const bodySchema = z.object({
  provider: providerEnum,
  identifier: z.string().min(1, 'Identificador é obrigatório'),
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

export async function adminLinkAuthMethodController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/users/:userId/auth-links',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.USERS.MODIFY,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Link an authentication method to a user (admin)',
      security: [{ bearerAuth: [] }],
      params: paramsSchema,
      body: bodySchema,
      response: {
        201: z.object({ authLink: authLinkSchema }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const { provider, identifier } = request.body;

      try {
        // Admin bypass: use a dummy password to skip password verification
        // The use case will handle admin flow via the isAdmin-like logic
        // We pass an empty currentPassword and rely on the admin-level factory
        const useCase = makeLinkAuthMethodUseCase();

        // For admin linking, we need to create the link directly
        // The LinkAuthMethodUseCase requires currentPassword for self-service
        // So we'll use a direct repository approach for admin
        const { PrismaAuthLinksRepository } = await import(
          '@/repositories/core/prisma/prisma-auth-links-repository'
        );
        const { normalizeIdentifier } = await import(
          '@/use-cases/core/auth/utils/detect-identifier-type'
        );
        const { authLinkToDTO } = await import(
          '@/mappers/core/auth-link/auth-link-to-dto'
        );

        const authLinksRepository = new PrismaAuthLinksRepository();
        const normalizedIdentifier = normalizeIdentifier(provider, identifier);

        // Check if identifier already linked to another user
        const existingLink =
          await authLinksRepository.findByProviderAndIdentifier(
            provider,
            normalizedIdentifier,
          );

        if (
          existingLink &&
          !existingLink.userId.equals(new UniqueEntityID(userId))
        ) {
          throw new ConflictError(
            'Este identificador já está vinculado a outra conta.',
          );
        }

        // Check if user already has this provider
        const userProviderLink =
          await authLinksRepository.findByUserIdAndProvider(
            new UniqueEntityID(userId),
            provider,
          );

        if (userProviderLink) {
          throw new ConflictError(
            'Usuário já possui um vínculo com este método.',
          );
        }

        // Create AuthLink (admin: no password/credential needed for OAuth-like providers)
        const authLink = await authLinksRepository.create({
          userId: new UniqueEntityID(userId),
          tenantId: null,
          provider,
          identifier: normalizedIdentifier,
          credential: null,
        });

        return reply
          .status(201)
          .send({ authLink: authLinkToDTO(authLink) });
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
