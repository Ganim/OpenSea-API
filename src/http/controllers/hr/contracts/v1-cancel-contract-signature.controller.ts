import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCancelContractSignatureUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CancelContractSignatureController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/contracts/:contractId/signature',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.MODIFY,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Cancel signature envelope attached to an employment contract',
      description:
        'Cancels the active signature envelope for the contract. The envelope reference is preserved on the contract for audit history.',
      params: z.object({
        contractId: z.string().min(1),
      }),
      body: z
        .object({
          reason: z.string().max(500).optional(),
        })
        .default({}),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { contractId } = request.params;
      const body = request.body as { reason?: string };

      try {
        const useCase = makeCancelContractSignatureUseCase();
        await useCase.execute({
          tenantId,
          contractId,
          userId,
          reason: body?.reason,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
