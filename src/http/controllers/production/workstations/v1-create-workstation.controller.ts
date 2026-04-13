import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkstationSchema,
  workstationResponseSchema,
} from '@/http/schemas/production';
import { workstationToDTO } from '@/mappers/production/workstation-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateWorkstationUseCase } from '@/use-cases/production/workstations/factories/make-create-workstation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createWorkstationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/workstations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REGISTER,
        resource: 'workstations',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Create a new workstation',
      body: createWorkstationSchema,
      response: {
        201: z.object({
          workstation: workstationResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
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
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createWorkstationUseCase = makeCreateWorkstationUseCase();
      const { workstation } = await createWorkstationUseCase.execute({
        tenantId,
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
        message: AUDIT_MESSAGES.PRODUCTION.WORKSTATION_CREATE,
        entityId: workstation.id.toString(),
        placeholders: { userName, name: workstation.name, code: workstation.code },
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
        .status(201)
        .send({ workstation: workstationToDTO(workstation) });
    },
  });
}
