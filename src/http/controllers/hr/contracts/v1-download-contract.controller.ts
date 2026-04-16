import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { generatedContractIdParamSchema } from '@/http/schemas/hr';
import { makeGetContractDownloadUrlUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1DownloadContractController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/contracts/:id/download',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.ACCESS,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Download a generated contract PDF',
      description:
        'Generates a short-lived presigned URL for the contract PDF stored in object storage and redirects the client to it (HTTP 302).',
      params: generatedContractIdParamSchema,
      response: {
        302: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeGetContractDownloadUrlUseCase();
        const { downloadUrl } = await useCase.execute({
          tenantId,
          contractId: id,
        });

        return reply.redirect(downloadUrl, 302);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
