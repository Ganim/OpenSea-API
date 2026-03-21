import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  certificateResponseSchema,
  uploadCertificateSchema,
} from '@/http/schemas/signature/signature.schema';
import { digitalCertificateToDTO } from '@/mappers/signature';
import { makeUploadCertificateUseCase } from '@/use-cases/signature/certificates/factories/make-upload-certificate-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function uploadCertificateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/certificates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.CERTIFICATES.REGISTER,
        resource: 'signature-certificates',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Upload a digital certificate',
      body: uploadCertificateSchema,
      response: {
        201: z.object({
          certificate: certificateResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeUploadCertificateUseCase();
      const { certificate } = await useCase.execute({
        tenantId,
        ...body,
      });

      return reply
        .status(201)
        .send({ certificate: digitalCertificateToDTO(certificate) });
    },
  });
}
