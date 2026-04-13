import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { defectTypeResponseSchema } from '@/http/schemas/production';
import { defectTypeToDTO } from '@/mappers/production/defect-type-to-dto';
import { makeListDefectTypesUseCase } from '@/use-cases/production/defect-types/factories/make-list-defect-types-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDefectTypesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/defect-types',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.ACCESS,
        resource: 'defect-types',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'List all defect types',
      response: {
        200: z.object({
          defectTypes: z.array(defectTypeResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const listDefectTypesUseCase = makeListDefectTypesUseCase();
      const { defectTypes } = await listDefectTypesUseCase.execute({
        tenantId,
      });

      return reply
        .status(200)
        .send({ defectTypes: defectTypes.map(defectTypeToDTO) });
    },
  });
}
