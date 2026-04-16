import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  contractTemplateSummaryResponseSchema,
  listContractTemplatesQuerySchema,
} from '@/http/schemas/hr';
import { contractTemplateToSummaryDTO } from '@/mappers/hr/contract-template';
import { makeListContractTemplatesUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const listResponseSchema = z.object({
  templates: z.array(contractTemplateSummaryResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

export async function v1ListContractTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/contract-templates',
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
      summary: 'List contract templates',
      description:
        'Returns a paginated list of contract templates for the current tenant. The (potentially large) template body is intentionally omitted from this list response — fetch a single template to inspect its content.',
      querystring: listContractTemplatesQuerySchema,
      response: { 200: listResponseSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, search, type, isActive } = request.query;

      const useCase = makeListContractTemplatesUseCase();
      const { templates, meta } = await useCase.execute({
        tenantId,
        page,
        perPage,
        search,
        type,
        isActive,
      });

      return reply.status(200).send({
        templates: templates.map(contractTemplateToSummaryDTO),
        meta,
      });
    },
  });
}
