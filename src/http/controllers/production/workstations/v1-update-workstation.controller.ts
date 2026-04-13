import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateWorkstationSchema,
  workstationResponseSchema,
} from '@/http/schemas/production';
import { workstationToDTO } from '@/mappers/production/workstation-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetWorkstationByIdUseCase } from '@/use-cases/production/workstations/factories/make-get-workstation-by-id-use-case';
import { makeUpdateWorkstationUseCase } from '@/use-cases/production/workstations/factories/make-update-workstation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateWorkstationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/workstations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.MODIFY,
        resource: 'workstations',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Update a workstation',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateWorkstationSchema,
      response: {
        200: z.object({
          workstation: workstationResponseSchema,
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
      const {
        workstationTypeId,
        workCenterId,
        code,
        name,
        description,
        capacityPerDay,
        costPerHour,
        setupTimeDefault,
        isActive,
      } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getWorkstationByIdUseCase = makeGetWorkstationByIdUseCase();

      const [{ user }, { workstation: oldWorkstation }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getWorkstationByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateWorkstationUseCase = makeUpdateWorkstationUseCase();
      const { workstation } = await updateWorkstationUseCase.execute({
        tenantId,
        id,
        workstationTypeId,
        workCenterId,
        code,
        name,
        description,
        capacityPerDay,
        costPerHour,
        setupTimeDefault,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORKSTATION_UPDATE,
        entityId: workstation.id.toString(),
        placeholders: { userName, name: workstation.name },
        oldData: { name: oldWorkstation.name, code: oldWorkstation.code },
        newData: {
          workstationTypeId,
          workCenterId,
          code,
          name,
          description,
          capacityPerDay,
          costPerHour,
          setupTimeDefault,
          isActive,
        },
      });

      return reply
        .status(200)
        .send({ workstation: workstationToDTO(workstation) });
    },
  });
}
