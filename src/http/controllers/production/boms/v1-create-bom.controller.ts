import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createBomSchema, bomResponseSchema } from '@/http/schemas/production';
import { bomToDTO } from '@/mappers/production/bom-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateBomUseCase } from '@/use-cases/production/boms/factories/make-create-bom-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBomController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/boms',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REGISTER,
        resource: 'boms',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Create a new bill of materials',
      body: createBomSchema,
      response: {
        201: z.object({
          bom: bomResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { productId, name, description, version, isDefault, baseQuantity } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createBomUseCase = makeCreateBomUseCase();
      const { bom } = await createBomUseCase.execute({
        tenantId,
        createdById: userId,
        productId,
        name,
        description,
        version,
        isDefault,
        baseQuantity,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.BOM_CREATE,
        entityId: bom.id.toString(),
        placeholders: {
          userName,
          name: bom.name,
          version: String(bom.version),
        },
        newData: {
          productId,
          name,
          description,
          version,
          isDefault,
          baseQuantity,
        },
      });

      return reply.status(201).send({ bom: bomToDTO(bom) });
    },
  });
}
