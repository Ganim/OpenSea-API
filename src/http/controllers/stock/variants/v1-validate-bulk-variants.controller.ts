import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeValidateBulkVariantsUseCase } from '@/use-cases/stock/variants/factories/make-validate-bulk-variants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const validateBulkVariantsSchema = z.object({
  productNames: z.array(z.string()).default([]),
  templateId: z.string().uuid(),
});

const entityRefSchema = z.object({
  name: z.string(),
  id: z.string(),
});

export async function validateBulkVariantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variants/bulk/validate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.CREATE,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'Validate variants for bulk import',
      body: validateBulkVariantsSchema,
      response: {
        200: z.object({
          existingProducts: z.array(entityRefSchema),
          missingProducts: z.array(z.string()),
          templateValid: z.boolean(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productNames, templateId } = request.body;

      const validateBulkVariantsUseCase = makeValidateBulkVariantsUseCase();
      const validationResult = await validateBulkVariantsUseCase.execute({
        tenantId,
        productNames,
        templateId,
      });

      return reply.status(200).send(validationResult);
    },
  });
}
