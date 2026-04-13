import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { updateBomSchema, bomResponseSchema } from '@/http/schemas/production';
import { bomToDTO } from '@/mappers/production/bom-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetBomByIdUseCase } from '@/use-cases/production/boms/factories/make-get-bom-by-id-use-case';
import { makeUpdateBomUseCase } from '@/use-cases/production/boms/factories/make-update-bom-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBomController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/boms/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.MODIFY,
        resource: 'boms',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Update a bill of materials',
      params: z.object({
        id: z.string(),
      }),
      body: updateBomSchema,
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
      const { name, description, isDefault, baseQuantity, validUntil } =
        request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getBomByIdUseCase = makeGetBomByIdUseCase();

      const [{ user }, { bom: oldBom }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getBomByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateBomUseCase = makeUpdateBomUseCase();
      const { bom } = await updateBomUseCase.execute({
        tenantId,
        id,
        name,
        description,
        isDefault,
        baseQuantity,
        validUntil,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.BOM_UPDATE,
        entityId: bom.id.toString(),
        placeholders: { userName, name: bom.name },
        oldData: { name: oldBom.name },
        newData: { name, description, isDefault, baseQuantity, validUntil },
      });

      return reply.status(200).send({ bom: bomToDTO(bom) });
    },
  });
}
