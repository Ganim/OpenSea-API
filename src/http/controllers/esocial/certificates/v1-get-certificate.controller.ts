import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { esocialCertificateResponseSchema } from '@/http/schemas/esocial';
import { makeGetCertificateUseCase } from '@/use-cases/esocial/certificates/factories/make-get-certificate';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetCertificateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/certificates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CERTIFICATES.ACCESS,
        resource: 'esocial-certificates',
      }),
    ],
    schema: {
      tags: ['eSocial - Certificates'],
      summary: 'Get certificate info',
      description:
        'Returns the eSocial certificate metadata for the current tenant (no PFX data).',
      response: {
        200: z.object({
          certificate: esocialCertificateResponseSchema.nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetCertificateUseCase();
      const { certificate } = await useCase.execute({ tenantId });

      if (!certificate) {
        return reply.status(200).send({ certificate: null });
      }

      return reply.status(200).send({
        certificate: {
          id: certificate.id.toString(),
          tenantId: certificate.tenantId.toString(),
          type: certificate.type,
          serialNumber: certificate.serialNumber,
          issuer: certificate.issuer,
          subject: certificate.subject,
          validFrom: certificate.validFrom,
          validUntil: certificate.validUntil,
          isActive: certificate.isActive,
          isExpired: certificate.isExpired(),
          isExpiringSoon: certificate.isExpiringSoon(),
          daysUntilExpiry: certificate.daysUntilExpiry(),
          createdAt: certificate.createdAt,
          updatedAt: certificate.updatedAt,
        },
      });
    },
  });
}
