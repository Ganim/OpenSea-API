import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteCertificateUseCase } from '@/use-cases/signature/certificates/factories/make-delete-certificate-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCertificateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/signature/certificates/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.CERTIFICATES.REMOVE,
        resource: 'signature-certificates',
      }),
    ],
    schema: {
      tags: ['Signature - Certificates'],
      summary: 'Delete a digital certificate',
      params: z.object({ id: z.string().uuid() }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeDeleteCertificateUseCase();
      await useCase.execute({ tenantId, certificateId: id });

      return reply.status(204).send();
    },
  });
}
