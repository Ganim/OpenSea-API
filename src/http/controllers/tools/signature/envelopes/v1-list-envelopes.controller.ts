import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeListEnvelopesUseCase } from '@/use-cases/signature/envelopes/factories/make-list-envelopes-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listEnvelopesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/envelopes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.ACCESS,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Signature - Envelopes'],
      summary: 'List signature envelopes',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.string().optional(),
        sourceModule: z.string().optional(),
        search: z.string().optional(),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status, sourceModule, search } = request.query;

      const useCase = makeListEnvelopesUseCase();
      const result = await useCase.execute({
        tenantId,
        status,
        sourceModule,
        search,
        page,
        limit,
      });

      return reply.status(200).send({
        envelopes: result.envelopes.map(signatureEnvelopeToDTO),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    },
  });
}
