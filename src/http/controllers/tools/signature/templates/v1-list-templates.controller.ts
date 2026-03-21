import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { signatureTemplateToDTO } from '@/mappers/signature';
import { makeListSignatureTemplatesUseCase } from '@/use-cases/signature/templates/factories/make-list-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listSignatureTemplatesController(app: FastifyInstance) {
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
      tags: ['Signature - Templates'],
      summary: 'List signature templates',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        isActive: z.coerce.boolean().optional(),
        search: z.string().optional(),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, isActive, search } = request.query;

      const useCase = makeListSignatureTemplatesUseCase();
      const result = await useCase.execute({
        tenantId,
        isActive,
        search,
        page,
        limit,
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
