import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { geofenceZoneResponseSchema } from '@/http/schemas';
import { makeListGeofenceZonesUseCase } from '@/use-cases/hr/geofence-zones/factories/make-list-geofence-zones-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { geofenceZoneToDTO } from './helpers';

export async function v1ListGeofenceZonesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/geofence-zones',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.ACCESS,
        resource: 'time-control',
      }),
    ],
    schema: {
      tags: ['HR - Geofence Zones'],
      summary: 'List geofence zones',
      description: 'Lists all geofence zones for the tenant',
      response: {
        200: z.object({
          geofenceZones: z.array(geofenceZoneResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListGeofenceZonesUseCase();
      const { geofenceZones } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        geofenceZones: geofenceZones.map(geofenceZoneToDTO),
      });
    },
  });
}
