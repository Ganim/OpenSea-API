import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createServeTokenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/serve-token',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Create a short-lived token for file serving',
      description:
        'Generates a 5-minute JWT token for use in <img>, <video>, <iframe> src attributes. Avoids exposing the long-lived session token in URLs.',
      response: {
        200: z.object({
          token: z.string(),
          expiresIn: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const expiresInSeconds = 300; // 5 minutes

      const token = await reply.jwtSign(
        {
          sub: request.user.sub,
          sessionId: request.user.sessionId,
          tenantId: request.user.tenantId,
          permissions: request.user.permissions,
          tokenType: 'serve' as const,
        },
        { expiresIn: `${expiresInSeconds}s` },
      );

      return reply.status(200).send({
        token,
        expiresIn: expiresInSeconds,
      });
    },
  });
}
