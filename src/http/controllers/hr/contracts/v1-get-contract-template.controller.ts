import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  contractTemplateIdParamSchema,
  contractTemplateResponseSchema,
} from '@/http/schemas/hr';
import { contractTemplateToDTO } from '@/mappers/hr/contract-template';
import { makeGetContractTemplateUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetContractTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/contract-templates/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.ACCESS,
        resource: 'contract-templates',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Get contract template by id',
      description:
        'Returns the full contract template including the merge-field body so the editor can render and modify it.',
      params: contractTemplateIdParamSchema,
      response: {
        200: z.object({ template: contractTemplateResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeGetContractTemplateUseCase();
        const { template } = await useCase.execute({
          tenantId,
          templateId: id,
        });

        return reply
          .status(200)
          .send({ template: contractTemplateToDTO(template) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
