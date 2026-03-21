import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  certificateResponseSchema,
  listCertificatesQuerySchema,
} from '@/http/schemas/signature/signature.schema';
import { digitalCertificateToDTO } from '@/mappers/signature';
import { makeListCertificatesUseCase } from '@/use-cases/signature/certificates/factories/make-list-certificates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCertificatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/certificates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.CERTIFICATES.ACCESS,
        resource: 'signature-certificates',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'List digital certificates',
      querystring: listCertificatesQuerySchema,
      response: {
        200: z.object({
          certificates: z.array(certificateResponseSchema),
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
      const { page, limit, status, type, search } = request.query;

      const useCase = makeListCertificatesUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
        type,
        search,
      });

      return reply.status(200).send({
        certificates: result.certificates.map(digitalCertificateToDTO),
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
