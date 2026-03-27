import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { blueprintResponseSchema } from '@/http/schemas/sales/blueprints';
import { processBlueprintToDTO } from '@/mappers/sales/process-blueprint/process-blueprint-to-dto';
import { makeGetBlueprintByIdUseCase } from '@/use-cases/sales/blueprints/factories/make-get-blueprint-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBlueprintByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/blueprints/:blueprintId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BLUEPRINTS.ACCESS,
        resource: 'blueprints',
      }),
    ],
    schema: {
      tags: ['Sales - Blueprints'],
      summary: 'Get a process blueprint by ID',
      params: z.object({
        blueprintId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          blueprint: blueprintResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { blueprintId } = request.params;

      const useCase = makeGetBlueprintByIdUseCase();
      const { blueprint } = await useCase.execute({ tenantId, blueprintId });

      return reply.status(200).send({
        blueprint: processBlueprintToDTO(blueprint),
      });
    },
  });
}
