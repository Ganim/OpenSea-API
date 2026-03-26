import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { esocialCertificateResponseSchema } from '@/http/schemas/esocial';
import { makeUploadCertificateUseCase } from '@/use-cases/esocial/certificates/factories/make-upload-certificate';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UploadCertificateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
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
      summary: 'Upload certificate',
      description:
        'Upload a PFX digital certificate for eSocial transmission. Replaces any existing certificate.',
      consumes: ['multipart/form-data'],
      response: {
        201: z.object({
          certificate: esocialCertificateResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const data = await request.file();

        if (!data) {
          return reply
            .status(400)
            .send({ message: 'PFX file is required' });
        }

        const pfxBuffer = await data.toBuffer();
        const type =
          (data.fields as any)?.type?.value ?? 'E_CNPJ';
        const passphrase =
          (data.fields as any)?.passphrase?.value ?? '';

        if (!passphrase) {
          return reply
            .status(400)
            .send({ message: 'Passphrase is required' });
        }

        const useCase = makeUploadCertificateUseCase();
        const { certificate } = await useCase.execute({
          tenantId,
          pfxData: pfxBuffer,
          passphrase,
          type,
        });

        return reply.status(201).send({
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
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
