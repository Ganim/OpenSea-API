import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateWorkstationTypeSchema,
  workstationTypeResponseSchema,
} from '@/http/schemas/production';
import { workstationTypeToDTO } from '@/mappers/production/workstation-type-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetWorkstationTypeByIdUseCase } from '@/use-cases/production/workstation-types/factories/make-get-workstation-type-by-id-use-case';
import { makeUpdateWorkstationTypeUseCase } from '@/use-cases/production/workstation-types/factories/make-update-workstation-type-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateWorkstationTypeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/workstation-types/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.MODIFY,
        resource: 'workstation-types',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Update a workstation type',
      params: z.object({
        id: z.string(),
      }),
      body: updateWorkstationTypeSchema,
      response: {
        200: z.object({
          workstationType: workstationTypeResponseSchema,
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
      const { name, description, icon, color, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getWorkstationTypeByIdUseCase = makeGetWorkstationTypeByIdUseCase();

      const [{ user }, { workstationType: oldWorkstationType }] =
        await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getWorkstationTypeByIdUseCase.execute({ tenantId, id }),
        ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateWorkstationTypeUseCase = makeUpdateWorkstationTypeUseCase();
      const { workstationType } = await updateWorkstationTypeUseCase.execute({
        tenantId,
        id,
        name,
        description,
        icon,
        color,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORKSTATION_TYPE_UPDATE,
        entityId: workstationType.id.toString(),
        placeholders: { userName, name: workstationType.name },
        oldData: { name: oldWorkstationType.name },
        newData: { name, description, icon, color, isActive },
      });

      return reply
        .status(200)
        .send({ workstationType: workstationTypeToDTO(workstationType) });
    },
  });
}
