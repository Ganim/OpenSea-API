import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  templateResponseSchema,
  updateTemplateSchema,
} from '@/http/schemas/signature/signature.schema';
import { signatureTemplateToDTO } from '@/mappers/signature';
import { makeUpdateSignatureTemplateUseCase } from '@/use-cases/signature/templates/factories/make-update-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/signature/templates/:templateId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.TEMPLATES.MODIFY,
        resource: 'signature-templates',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Update a signature template',
      params: z.object({
        templateId: z.string().uuid().describe('Signature template UUID'),
      }),
      body: updateTemplateSchema,
      response: {
        200: z.object({
          template: templateResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { templateId } = request.params;
      const body = request.body;

      const useCase = makeUpdateSignatureTemplateUseCase();
      const { template } = await useCase.execute({
        tenantId,
        templateId,
        ...body,
      });

      return reply
        .status(200)
        .send({ template: signatureTemplateToDTO(template) });
    },
  });
}
