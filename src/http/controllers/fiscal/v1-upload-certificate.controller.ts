import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  certificateResponseSchema,
  uploadCertificateBodySchema,
} from '@/http/schemas/fiscal';
import { makeUploadCertificateUseCase } from '@/use-cases/fiscal/certificates/factories/make-upload-certificate-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function uploadCertificateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/fiscal/certificates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.FISCAL.ADMIN,
        resource: 'fiscal',
      }),
    ],
    schema: {
      tags: ['Fiscal'],
      summary: 'Upload a digital certificate (A1/A3)',
      body: uploadCertificateBodySchema,
      response: {
        201: z.object({ certificate: certificateResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeUploadCertificateUseCase();
        const { certificate } = await useCase.execute({
          tenantId,
          pfxBuffer: Buffer.from('placeholder-pfx-data'),
          pfxPassword: request.body.pfxPassword,
          serialNumber: request.body.serialNumber,
          issuer: request.body.issuer,
          subject: request.body.subject,
          validFrom: request.body.validFrom,
          validUntil: request.body.validUntil,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FISCAL.CERTIFICATE_UPLOAD,
          entityId: certificate.id.toString(),
          placeholders: {
            userName: request.user.sub,
            serialNumber: certificate.serialNumber,
            validUntil: certificate.validUntil.toISOString().split('T')[0],
          },
          newData: {
            serialNumber: certificate.serialNumber,
            issuer: certificate.issuer,
            subject: certificate.subject,
          },
        });

        return reply.status(201).send({
          certificate: {
            id: certificate.id.toString(),
            serialNumber: certificate.serialNumber,
            issuer: certificate.issuer,
            subject: certificate.subject,
            validFrom: certificate.validFrom,
            validUntil: certificate.validUntil,
            status: certificate.status,
            daysUntilExpiry: certificate.daysUntilExpiry(),
            createdAt: certificate.createdAt,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
