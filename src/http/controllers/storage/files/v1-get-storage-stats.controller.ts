import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageStatsResponseSchema } from '@/http/schemas/storage';
import { makeGetStorageStatsUseCase } from '@/use-cases/storage/files/factories/make-get-storage-stats-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getStorageStatsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/stats',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.STATS.VIEW,
        resource: 'storage-stats',
      }),
    ],
    schema: {
      tags: ['Storage - Stats'],
      summary: 'Get storage statistics for the current tenant',
      response: {
        200: storageStatsResponseSchema.extend({
          usedStoragePercent: z.number().min(0).max(100),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const getStorageStatsUseCase = makeGetStorageStatsUseCase();
      const { totalFiles, totalSize, filesByType } =
        await getStorageStatsUseCase.execute({ tenantId });

      // Calculate used storage percentage (assuming 10GB tenant limit)
      const TENANT_STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB
      const usedStoragePercent = Math.min(
        (totalSize / TENANT_STORAGE_LIMIT) * 100,
        100,
      );

      return reply.status(200).send({
        totalFiles,
        totalSize,
        filesByType,
        usedStoragePercent: Math.round(usedStoragePercent * 100) / 100,
      });
    },
  });
}
