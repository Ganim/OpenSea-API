import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import {
  listPermissionsByModulesQuerySchema,
  permissionByModuleSchema,
} from '@/http/schemas/rbac.schema';
import { makeListPermissionsByModulesUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPermissionsByModulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permissions/by-modules',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.PERMISSIONS.READ,
        resource: 'permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - Permissions'],
      summary: 'List permissions grouped by modules',
      querystring: listPermissionsByModulesQuerySchema,
      response: {
        200: z.object({
          modules: z.array(permissionByModuleSchema),
          totalPermissions: z.number(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { includeSystem } = request.query;

      const listPermissionsByModulesUseCase =
        makeListPermissionsByModulesUseCase();

      const { modules, totalPermissions } =
        await listPermissionsByModulesUseCase.execute({
          includeSystem,
        });

      // Converter permissões para formato HTTP
      const modulesFormatted = modules.map((module) => ({
        module: module.module,
        permissions: PermissionPresenter.toHTTPMany(module.permissions),
        total: module.total,
      }));

      return reply.status(200).send({
        modules: modulesFormatted,
        totalPermissions,
      });
    },
  });
}
