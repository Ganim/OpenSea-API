import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeVerifyProtectionUseCase } from '@/use-cases/storage/security/factories/make-verify-protection-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function verifyProtectionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/security/verify',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.FILES.READ,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Security'],
      summary: 'Verify a password for a protected file or folder',
      body: z.object({
        itemId: z.string().uuid(),
        itemType: z.enum(['file', 'folder']),
        password: z.string().min(1),
      }),
      response: {
        200: z.object({
          valid: z.boolean(),
        }),
        404: z.object({
          message: z.string(),
        }),
        429: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { itemId, itemType, password } = request.body;

      try {
        const useCase = makeVerifyProtectionUseCase();
        const { valid } = await useCase.execute({
          tenantId,
          itemId,
          itemType,
          password,
        });

        return reply.status(200).send({ valid });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
