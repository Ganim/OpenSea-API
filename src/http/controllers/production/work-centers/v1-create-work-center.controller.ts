import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkCenterSchema,
  workCenterResponseSchema,
} from '@/http/schemas/production';
import { workCenterToDTO } from '@/mappers/production/work-center-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateWorkCenterUseCase } from '@/use-cases/production/work-centers/factories/make-create-work-center-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createWorkCenterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/work-centers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REGISTER,
        resource: 'work-centers',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Create a new work center',
      body: createWorkCenterSchema,
      response: {
        201: z.object({
          workCenter: workCenterResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { code, name, description, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createWorkCenterUseCase = makeCreateWorkCenterUseCase();
      const { workCenter } = await createWorkCenterUseCase.execute({
        tenantId,
        code,
        name,
        description,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORK_CENTER_CREATE,
        entityId: workCenter.id.toString(),
        placeholders: { userName, name: workCenter.name, code: workCenter.code },
        newData: { code, name, description, isActive },
      });

      return reply
        .status(201)
        .send({ workCenter: workCenterToDTO(workCenter) });
    },
  });
}
