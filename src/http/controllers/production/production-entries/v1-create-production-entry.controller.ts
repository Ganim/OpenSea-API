import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createProductionEntrySchema,
  productionEntryResponseSchema,
} from '@/http/schemas/production';
import { productionEntryToDTO } from '@/mappers/production/production-entry-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateProductionEntryUseCase } from '@/use-cases/production/production-entries/factories/make-create-production-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductionEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/production-entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.REGISTER,
        resource: 'production-entries',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Create a production entry (quantity reporting)',
      body: createProductionEntrySchema,
      response: {
        201: z.object({
          productionEntry: productionEntryResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const {
        jobCardId,
        quantityGood,
        quantityScrapped,
        quantityRework,
        notes,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createProductionEntryUseCase = makeCreateProductionEntryUseCase();
      const { productionEntry } = await createProductionEntryUseCase.execute({
        jobCardId,
        operatorId: userId,
        quantityGood,
        quantityScrapped,
        quantityRework,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.PRODUCTION_ENTRY_CREATE,
        entityId: productionEntry.productionEntryId.toString(),
        placeholders: {
          userName,
          quantityGood: String(quantityGood),
          quantityScrapped: String(quantityScrapped ?? 0),
        },
        newData: {
          jobCardId,
          quantityGood,
          quantityScrapped,
          quantityRework,
          notes,
        },
      });

      return reply
        .status(201)
        .send({ productionEntry: productionEntryToDTO(productionEntry) });
    },
  });
}
