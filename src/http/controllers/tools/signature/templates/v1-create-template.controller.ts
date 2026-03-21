import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { signatureTemplateToDTO } from '@/mappers/signature';
import { makeCreateSignatureTemplateUseCase } from '@/use-cases/signature/templates/factories/make-create-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createSignatureTemplateController(app: FastifyInstance) {
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
      tags: ['Signature - Templates'],
      summary: 'Create a new signature template',
      body: z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        signatureLevel: z.enum(['SIMPLE', 'ADVANCED', 'QUALIFIED']),
        routingType: z.enum(['SEQUENTIAL', 'PARALLEL', 'HYBRID']),
        signerSlots: z.array(z.object({
          order: z.number().int(),
          group: z.number().int(),
          role: z.string(),
          label: z.string(),
          signatureLevel: z.string().optional(),
        })),
        expirationDays: z.number().int().min(1).optional(),
        reminderDays: z.number().int().min(1).optional(),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeCreateSignatureTemplateUseCase();
      const { template } = await useCase.execute({
        tenantId,
        name: body.name,
        description: body.description,
        signatureLevel: body.signatureLevel,
        routingType: body.routingType,
        signerSlots: body.signerSlots,
        expirationDays: body.expirationDays,
        reminderDays: body.reminderDays,
      });

      return reply.status(201).send({
        template: signatureTemplateToDTO(template),
      });
    },
  });
}
