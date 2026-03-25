import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { punchConfigResponseSchema } from '@/http/schemas';
import { makeGetPunchConfigUseCase } from '@/use-cases/hr/punch-config/factories/make-get-punch-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

function punchConfigToDTO(config: {
  id: { toString(): string };
  tenantId: string;
  selfieRequired: boolean;
  gpsRequired: boolean;
  geofenceEnabled: boolean;
  qrCodeEnabled: boolean;
  directLoginEnabled: boolean;
  kioskModeEnabled: boolean;
  pwaEnabled: boolean;
  offlineAllowed: boolean;
  maxOfflineHours: number;
  toleranceMinutes: number;
  autoClockOutHours: number | null;
  pdfReceiptEnabled: boolean;
  defaultRadiusMeters: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId,
    selfieRequired: config.selfieRequired,
    gpsRequired: config.gpsRequired,
    geofenceEnabled: config.geofenceEnabled,
    qrCodeEnabled: config.qrCodeEnabled,
    directLoginEnabled: config.directLoginEnabled,
    kioskModeEnabled: config.kioskModeEnabled,
    pwaEnabled: config.pwaEnabled,
    offlineAllowed: config.offlineAllowed,
    maxOfflineHours: config.maxOfflineHours,
    toleranceMinutes: config.toleranceMinutes,
    autoClockOutHours: config.autoClockOutHours,
    pdfReceiptEnabled: config.pdfReceiptEnabled,
    defaultRadiusMeters: config.defaultRadiusMeters,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

export async function v1GetPunchConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.ADMIN,
        resource: 'time-control',
      }),
    ],
    schema: {
      tags: ['HR - Punch Configuration'],
      summary: 'Get punch configuration',
      description:
        'Gets the punch configuration for the tenant. Creates default if none exists.',
      response: {
        200: z.object({
          punchConfig: punchConfigResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetPunchConfigUseCase();
      const { punchConfig } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        punchConfig: punchConfigToDTO(punchConfig),
      });
    },
  });
}
