import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { getFiscalConfigResponseSchema } from '@/http/schemas/sales/pos/fiscal-config.schema';
import { makeGetTenantFiscalConfigUseCase } from '@/use-cases/sales/pos-fiscal/factories/make-get-tenant-fiscal-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * GET /v1/admin/pos/fiscal-config
 *
 * Fetches the singleton `PosFiscalConfig` for the requesting tenant
 * (Emporion Plan A — Task 32). Returns `{ fiscalConfig: null }` when no
 * configuration has been persisted yet — this is the first-time-setup signal
 * the frontend uses to render the create form instead of the edit form.
 *
 * Tenant isolation is enforced by the use case (the `tenantId` is taken from
 * the JWT, never from a path/query parameter).
 *
 * Protected by `sales.pos.admin` permission.
 */
export async function v1GetFiscalConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/pos/fiscal-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ADMIN,
        resource: 'pos-fiscal-config',
      }),
    ],
    schema: {
      tags: ['POS - Admin'],
      summary: 'Get tenant POS fiscal configuration',
      description:
        'Returns the singleton `PosFiscalConfig` row for the requesting tenant, or `{ fiscalConfig: null }` when the tenant has not configured the fiscal subsystem yet. The frontend uses the `null` signal to render the first-time setup panel. Requires `sales.pos.admin` permission.',
      response: {
        200: getFiscalConfigResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const getTenantFiscalConfigUseCase = makeGetTenantFiscalConfigUseCase();
      const { fiscalConfig } = await getTenantFiscalConfigUseCase.execute({
        tenantId,
      });

      return reply.status(200).send({ fiscalConfig });
    },
  });
}
