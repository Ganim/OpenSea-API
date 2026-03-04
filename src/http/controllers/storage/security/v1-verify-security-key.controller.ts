import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { VerifySecurityKeyUseCase } from '@/use-cases/storage/security/verify-security-key';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function verifySecurityKeyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/security/verify-key',
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
      summary: 'Verify the current user security key',
      body: z.object({
        key: z.string().min(1).max(100),
      }),
      response: {
        200: z.object({
          valid: z.boolean(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { key } = request.body;

      const useCase = new VerifySecurityKeyUseCase();
      const { valid } = await useCase.execute({ tenantId, userId, key });

      return reply.status(200).send({ valid });
    },
  });
}
