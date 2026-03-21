import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createGeneratedContentSchema, generatedContentResponseSchema } from '@/http/schemas';
import { generatedContentToDTO } from '@/mappers/sales/generated-content/generated-content-to-dto';
import { makeCreateGeneratedContentUseCase } from '@/use-cases/sales/generated-contents/factories/make-create-generated-content-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createContentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/content/generate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTENT.REGISTER,
        resource: 'content',
      }),
    ],
    schema: {
      tags: ['Sales - Content'],
      summary: 'Generate new content',
      body: createGeneratedContentSchema,
      response: {
        201: z.object({ content: generatedContentResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateGeneratedContentUseCase();
      const { content } = await useCase.execute({
        tenantId,
        ...body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CONTENT_CREATE,
        entityId: content.id.toString(),
        placeholders: { userName: userId, contentTitle: content.title ?? 'Sem título' },
        newData: { type: body.type, channel: body.channel },
      });

      return reply.status(201).send({ content: generatedContentToDTO(content) });
    },
  });
}
