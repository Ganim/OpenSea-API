import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  envelopeResponseSchema,
  listEnvelopesQuerySchema,
} from '@/http/schemas/signature/signature.schema';
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
      tags: ['Tools - Digital Signature'],
      summary: 'List signature envelopes',
      querystring: listEnvelopesQuerySchema,
      response: {
        200: z.object({
          envelopes: z.array(envelopeResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status, sourceModule, createdByUserId, search } =
        request.query;

      const useCase = makeListEnvelopesUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
        sourceModule,
        createdByUserId,
        search,
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
