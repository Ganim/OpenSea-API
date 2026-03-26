import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteCertificateUseCase } from '@/use-cases/esocial/certificates/factories/make-delete-certificate';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteCertificateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/esocial/certificates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CERTIFICATES.ADMIN,
        resource: 'esocial-certificates',
      }),
    ],
    schema: {
      tags: ['eSocial - Certificates'],
      summary: 'Delete certificate',
      description:
        'Delete the current eSocial certificate for the tenant.',
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeDeleteCertificateUseCase();
        await useCase.execute({ tenantId });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
