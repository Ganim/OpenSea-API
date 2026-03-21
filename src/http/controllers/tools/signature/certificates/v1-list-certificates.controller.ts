import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
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
      tags: ['Signature - Certificates'],
      summary: 'List digital certificates',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status, type, search } = request.query;

      const useCase = makeListCertificatesUseCase();
      const result = await useCase.execute({
        tenantId,
        status,
        type,
        search,
        page,
        limit,
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
