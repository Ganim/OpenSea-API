import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  validateGeofenceBodySchema,
  validateGeofenceResponseSchema,
} from '@/http/schemas';
import { makeValidateGeofenceUseCase } from '@/use-cases/hr/geofence-zones/factories/make-validate-geofence-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { geofenceZoneToDTO } from './helpers';

export async function v1ValidateGeofenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/geofence-zones/validate',
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
      summary: 'Validate geofence location',
      description:
        'Checks if the given latitude/longitude is within any active geofence zone',
      body: validateGeofenceBodySchema,
      response: {
        200: validateGeofenceResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { latitude, longitude } = request.body;

      const useCase = makeValidateGeofenceUseCase();
      const result = await useCase.execute({
        tenantId,
        latitude,
        longitude,
      });

      return reply.status(200).send({
        isWithinZone: result.isWithinZone,
        matchedZone: result.matchedZone
          ? geofenceZoneToDTO(result.matchedZone)
          : null,
        distanceMeters: result.distanceMeters,
      });
    },
  });
}
