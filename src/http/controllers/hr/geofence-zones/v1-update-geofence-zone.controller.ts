import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  geofenceZoneResponseSchema,
  updateGeofenceZoneBodySchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { makeUpdateGeofenceZoneUseCase } from '@/use-cases/hr/geofence-zones/factories/make-update-geofence-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { geofenceZoneToDTO } from './helpers';

export async function v1UpdateGeofenceZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/geofence-zones/:id',
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
      summary: 'Update geofence zone',
      description: 'Updates an existing geofence zone',
      params: z.object({ id: idSchema }),
      body: updateGeofenceZoneBodySchema,
      response: {
        200: z.object({
          geofenceZone: geofenceZoneResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateGeofenceZoneUseCase();
        const { geofenceZone } = await useCase.execute({
          id,
          tenantId,
          data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.GEOFENCE_ZONE_UPDATE,
          entityId: geofenceZone.id.toString(),
          placeholders: {
            zoneName: geofenceZone.name,
          },
        });

        return reply.status(200).send({
          geofenceZone: geofenceZoneToDTO(geofenceZone),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
