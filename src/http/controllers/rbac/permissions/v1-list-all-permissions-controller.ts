import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { listAllPermissions } from './v1-list-all-permissions.controller';

export async function listAllPermissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permissions/all',
    onRequest: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.PERMISSIONS.READ,
        resource: 'permissions',
      }),
    ],
    schema: {
      summary: 'List all permissions grouped by module',
      description:
        'Returns all permissions in the system organized by module and resource',
      tags: ['RBAC - Permissions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          permissions: z.array(
            z.object({
              module: z.string(),
              description: z.string(),
              resources: z.record(
                z.string(),
                z.object({
                  description: z.string(),
                  permissions: z.array(
                    z.object({
                      id: z.string(),
                      code: z.string(),
                      name: z.string(),
                      action: z.string(),
                      isDeprecated: z.boolean(),
                    }),
                  ),
                }),
              ),
            }),
          ),
          total: z.number(),
          modules: z.array(z.string()),
        }),
      },
    },
    handler: listAllPermissions,
  });
}
