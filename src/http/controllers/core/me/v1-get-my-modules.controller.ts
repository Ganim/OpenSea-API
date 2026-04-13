import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getMyModulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/modules',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Me'],
      summary: 'Get active modules for current tenant',
      response: {
        200: z.object({
          modules: z.array(z.string()),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const service = new TenantContextService();
      const modules = await service.getActiveModules(tenantId);
      return reply.send({ modules });
    },
  });
}
