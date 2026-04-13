import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bomResponseSchema } from '@/http/schemas/production';
import { bomToDTO } from '@/mappers/production/bom-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeApproveBomUseCase } from '@/use-cases/production/boms/factories/make-approve-bom-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function approveBomController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/boms/:id/approve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ADMIN,
        resource: 'boms',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Approve a bill of materials',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          bom: bomResponseSchema,
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
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const approveBomUseCase = makeApproveBomUseCase();
      const { bom } = await approveBomUseCase.execute({
        tenantId,
        id,
        approvedById: userId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.BOM_APPROVE,
        entityId: bom.id.toString(),
        placeholders: {
          userName,
          name: bom.name,
          version: String(bom.version),
        },
        newData: { status: bom.status, approvedById: userId },
      });

      return reply.status(200).send({ bom: bomToDTO(bom) });
    },
  });
}
