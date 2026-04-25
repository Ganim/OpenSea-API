import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateFiscalConfigBodySchema,
  updateFiscalConfigResponseSchema,
} from '@/http/schemas/sales/pos/fiscal-config.schema';
import { makeUpdateTenantFiscalConfigUseCase } from '@/use-cases/sales/pos-fiscal/factories/make-update-tenant-fiscal-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * PUT /v1/admin/pos/fiscal-config
 *
 * Upserts the singleton tenant POS fiscal configuration (Emporion Plan A —
 * Task 32). The configuration is keyed by `tenantId` (no `:id` parameter),
 * so this endpoint always mutates the same row for the requesting tenant.
 *
 * Cross-field invariants enforced by the use case:
 *  - `defaultDocumentType` must be in `enabledDocumentTypes`
 *  - NFC-e + ONLINE_SYNC requires `nfceSeries` and `nfceNextNumber`
 *  - NFE/NFC-e + transmitting modes require `certificatePath`
 * On invariant violation the use case throws `BadRequestError` and we surface
 * it as `400 { message }` so the frontend can render the inline error.
 *
 * Protected by `sales.pos.admin` permission.
 */
export async function v1UpdateFiscalConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
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
      summary: 'Upsert tenant POS fiscal configuration',
      description:
        'Upserts the singleton `PosFiscalConfig` row for the requesting tenant. Validates cross-field invariants (default in enabled, NFC-e online counter presence, certificate presence for transmitting modes) — invariant violations return `400 { message }`. Requires `sales.pos.admin` permission.',
      body: updateFiscalConfigBodySchema,
      response: {
        200: updateFiscalConfigResponseSchema,
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const updateTenantFiscalConfigUseCase =
          makeUpdateTenantFiscalConfigUseCase();
        const { fiscalConfig } = await updateTenantFiscalConfigUseCase.execute({
          tenantId,
          userId,
          enabledDocumentTypes: request.body.enabledDocumentTypes,
          defaultDocumentType: request.body.defaultDocumentType,
          emissionMode: request.body.emissionMode,
          certificatePath: request.body.certificatePath ?? null,
          nfceSeries: request.body.nfceSeries ?? null,
          nfceNextNumber: request.body.nfceNextNumber ?? null,
          satDeviceId: request.body.satDeviceId ?? null,
        });

        return reply.status(200).send({ fiscalConfig });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
