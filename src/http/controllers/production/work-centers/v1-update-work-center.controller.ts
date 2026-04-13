import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateWorkCenterSchema,
  workCenterResponseSchema,
} from '@/http/schemas/production';
import { workCenterToDTO } from '@/mappers/production/work-center-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetWorkCenterByIdUseCase } from '@/use-cases/production/work-centers/factories/make-get-work-center-by-id-use-case';
import { makeUpdateWorkCenterUseCase } from '@/use-cases/production/work-centers/factories/make-update-work-center-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateWorkCenterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/work-centers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.MODIFY,
        resource: 'work-centers',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Update a work center',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateWorkCenterSchema,
      response: {
        200: z.object({
          workCenter: workCenterResponseSchema,
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
      const { code, name, description, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getWorkCenterByIdUseCase = makeGetWorkCenterByIdUseCase();

      const [{ user }, { workCenter: oldWorkCenter }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getWorkCenterByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateWorkCenterUseCase = makeUpdateWorkCenterUseCase();
      const { workCenter } = await updateWorkCenterUseCase.execute({
        tenantId,
        id,
        code,
        name,
        description,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORK_CENTER_UPDATE,
        entityId: workCenter.id.toString(),
        placeholders: { userName, name: workCenter.name },
        oldData: { name: oldWorkCenter.name, code: oldWorkCenter.code },
        newData: { code, name, description, isActive },
      });

      return reply
        .status(200)
        .send({ workCenter: workCenterToDTO(workCenter) });
    },
  });
}
