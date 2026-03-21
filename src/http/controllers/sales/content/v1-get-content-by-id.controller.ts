import { PermissionCodes } from '@/constants/rbac';
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

export async function getContentByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/content/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTENT.ACCESS,
        resource: 'content',
      }),
    ],
    schema: {
      tags: ['Sales - Content'],
      summary: 'Get generated content by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ content: generatedContentResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const repository = new PrismaGeneratedContentsRepository();
      const content = await repository.findById(
        new UniqueEntityID(id),
        tenantId,
      );

      if (!content) {
        throw new ResourceNotFoundError('Content not found');
      }

      return reply.status(200).send({ content: generatedContentToDTO(content) });
    },
  });
}
