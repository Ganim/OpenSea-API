import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkstationTypeSchema,
  workstationTypeResponseSchema,
} from '@/http/schemas/production';
import { workstationTypeToDTO } from '@/mappers/production/workstation-type-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateWorkstationTypeUseCase } from '@/use-cases/production/workstation-types/factories/make-create-workstation-type-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createWorkstationTypeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/workstation-types',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REGISTER,
        resource: 'workstation-types',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Create a new workstation type',
      body: createWorkstationTypeSchema,
      response: {
        201: z.object({
          workstationType: workstationTypeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { name, description, icon, color, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createWorkstationTypeUseCase = makeCreateWorkstationTypeUseCase();
      const { workstationType } = await createWorkstationTypeUseCase.execute({
        tenantId,
        name,
        description,
        icon,
        color,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORKSTATION_TYPE_CREATE,
        entityId: workstationType.id.toString(),
        placeholders: { userName, name: workstationType.name },
        newData: { name, description, icon, color, isActive },
      });

      return reply
        .status(201)
        .send({ workstationType: workstationTypeToDTO(workstationType) });
    },
  });
}
