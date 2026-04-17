import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  GetEsocialConfigUseCase,
  UpdateEsocialConfigUseCase,
} from '@/use-cases/hr/esocial/manage-esocial-config';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { updateConfigBodySchema } from './esocial-api-schemas';

/**
 * Legacy HR eSocial config controller. Kept as defense-in-depth —
 * the live config endpoints now live under controllers/esocial/config with
 * full RBAC. If this controller is ever re-registered, the middleware below
 * ensures only users with ESOCIAL.CONFIG permissions can read/mutate the
 * environment setting and auto-generation flags (P0-08 ops).
 */
export async function v1EsocialConfigController(app: FastifyInstance) {
  const getUseCase = new GetEsocialConfigUseCase();
  const updateUseCase = new UpdateEsocialConfigUseCase();

  // GET config
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CONFIG.ACCESS,
        resource: 'esocial-config',
      }),
    ],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Get eSocial configuration',
      description: 'Returns the eSocial configuration for the current tenant',
      response: {
        200: z.any(),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const result = await getUseCase.execute({ tenantId });
        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(500).send({ message });
      }
    },
  });

  // PATCH config
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/esocial/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CONFIG.ADMIN,
        resource: 'esocial-config',
      }),
    ],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Update eSocial configuration',
      description: 'Updates the eSocial configuration for the current tenant',
      body: updateConfigBodySchema,
      response: {
        200: z.any(),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const body = request.body as z.infer<typeof updateConfigBodySchema>;

        const result = await updateUseCase.execute({
          tenantId,
          ...body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(500).send({ message });
      }
    },
  });
}
