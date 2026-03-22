import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { generatedContentResponseSchema } from '@/http/schemas';
import { generatedContentToDTO } from '@/mappers/sales/generated-content/generated-content-to-dto';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PrismaGeneratedContentsRepository } from '@/repositories/sales/prisma/prisma-generated-contents-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function approveContentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/content/:id/approve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTENT.ADMIN,
        resource: 'content',
      }),
    ],
    schema: {
      tags: ['Sales - Content'],
      summary: 'Approve generated content',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ content: generatedContentResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      const repository = new PrismaGeneratedContentsRepository();
      const content = await repository.findById(
        new UniqueEntityID(id),
        tenantId,
      );

      if (!content) {
        throw new ResourceNotFoundError('Content not found');
      }

      content.approve(userId);
      await repository.save(content);

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CONTENT_APPROVE,
        entityId: id,
        placeholders: {
          userName: userId,
          contentTitle: content.title ?? 'Sem título',
        },
      });

      return reply
        .status(200)
        .send({ content: generatedContentToDTO(content) });
    },
  });
}
