import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  punchConfigResponseSchema,
  updatePunchConfigBodySchema,
} from '@/http/schemas';
import { makeUpdatePunchConfigUseCase } from '@/use-cases/hr/punch-config/factories/make-update-punch-config-use-case';
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

export async function v1UpdatePunchConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
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
      summary: 'Update punch configuration',
      description: 'Updates the punch configuration for the tenant',
      body: updatePunchConfigBodySchema,
      response: {
        200: z.object({
          punchConfig: punchConfigResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeUpdatePunchConfigUseCase();
        const { punchConfig } = await useCase.execute({ tenantId, data });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_CONFIG_UPDATE,
          entityId: punchConfig.id.toString(),
        });

        return reply.status(200).send({
          punchConfig: punchConfigToDTO(punchConfig),
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
