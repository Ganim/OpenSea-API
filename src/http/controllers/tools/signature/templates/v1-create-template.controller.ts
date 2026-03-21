import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTemplateSchema,
  templateResponseSchema,
} from '@/http/schemas/signature/signature.schema';
import { signatureTemplateToDTO } from '@/mappers/signature';
import { makeCreateSignatureTemplateUseCase } from '@/use-cases/signature/templates/factories/make-create-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/templates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.TEMPLATES.REGISTER,
        resource: 'signature-templates',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Create a signature template',
      body: createTemplateSchema,
      response: {
        201: z.object({
          template: templateResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeCreateSignatureTemplateUseCase();
      const { template } = await useCase.execute({
        tenantId,
        ...body,
      });

      return reply
        .status(201)
        .send({ template: signatureTemplateToDTO(template) });
    },
  });
}
