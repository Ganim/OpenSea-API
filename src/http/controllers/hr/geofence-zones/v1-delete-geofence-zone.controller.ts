import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { makeDeleteGeofenceZoneUseCase } from '@/use-cases/hr/geofence-zones/factories/make-delete-geofence-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteGeofenceZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
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
      summary: 'Delete geofence zone',
      description: 'Deletes a geofence zone',
      params: z.object({ id: idSchema }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        // Fetch zone name for audit log before deletion
        const repo = new PrismaGeofenceZonesRepository();
        const zone = await repo.findById(new UniqueEntityID(id), tenantId);
        const zoneName = zone?.name ?? 'Unknown';

        const useCase = makeDeleteGeofenceZoneUseCase();
        await useCase.execute({ id, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.GEOFENCE_ZONE_DELETE,
          entityId: id,
          placeholders: {
            zoneName,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
