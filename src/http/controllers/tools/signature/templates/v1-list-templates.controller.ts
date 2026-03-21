import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listTemplatesQuerySchema,
  templateResponseSchema,
} from '@/http/schemas/signature/signature.schema';
import { signatureTemplateToDTO } from '@/mappers/signature';
import { makeListSignatureTemplatesUseCase } from '@/use-cases/signature/templates/factories/make-list-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/templates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.TEMPLATES.ACCESS,
        resource: 'signature-templates',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'List signature templates',
      querystring: listTemplatesQuerySchema,
      response: {
        200: z.object({
          templates: z.array(templateResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, isActive, search } = request.query;

      const useCase = makeListSignatureTemplatesUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        isActive,
        search,
      });

      return reply.status(200).send({
        templates: result.templates.map(signatureTemplateToDTO),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    },
  });
}
