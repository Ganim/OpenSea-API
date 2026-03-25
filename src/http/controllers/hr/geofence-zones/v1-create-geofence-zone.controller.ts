import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createGeofenceZoneBodySchema,
  geofenceZoneResponseSchema,
} from '@/http/schemas';
import { makeCreateGeofenceZoneUseCase } from '@/use-cases/hr/geofence-zones/factories/make-create-geofence-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { geofenceZoneToDTO } from './helpers';

export async function v1CreateGeofenceZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/geofence-zones',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.ADMIN,
        resource: 'time-control',
      }),
    ],
    schema: {
      tags: ['HR - Geofence Zones'],
      summary: 'Create geofence zone',
      description: 'Creates a new geofence zone for the tenant',
      body: createGeofenceZoneBodySchema,
      response: {
        201: z.object({
          geofenceZone: geofenceZoneResponseSchema,
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
        const useCase = makeCreateGeofenceZoneUseCase();
        const { geofenceZone } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.GEOFENCE_ZONE_CREATE,
          entityId: geofenceZone.id.toString(),
          placeholders: {
            zoneName: geofenceZone.name,
          },
        });

        return reply.status(201).send({
          geofenceZone: geofenceZoneToDTO(geofenceZone),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
