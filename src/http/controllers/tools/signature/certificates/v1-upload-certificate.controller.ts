import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
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
      tags: ['Signature - Certificates'],
      summary: 'Upload a new digital certificate',
      body: z.object({
        name: z.string().min(1).max(128),
        type: z.enum(['A1', 'A3', 'CLOUD_NEOID', 'CLOUD_BIRDID', 'CLOUD_OTHER']),
        subjectName: z.string().optional(),
        subjectCnpj: z.string().optional(),
        subjectCpf: z.string().optional(),
        issuerName: z.string().optional(),
        serialNumber: z.string().optional(),
        validFrom: z.string().datetime().optional(),
        validUntil: z.string().datetime().optional(),
        thumbprint: z.string().optional(),
        pfxFileId: z.string().uuid().optional(),
        pfxPassword: z.string().optional(),
        cloudProviderId: z.string().optional(),
        alertDaysBefore: z.number().int().min(1).optional(),
        isDefault: z.boolean().optional(),
        allowedModules: z.array(z.string()).optional(),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeUploadCertificateUseCase();
      const { certificate } = await useCase.execute({
        tenantId,
        name: body.name,
        type: body.type,
        subjectName: body.subjectName,
        subjectCnpj: body.subjectCnpj,
        subjectCpf: body.subjectCpf,
        issuerName: body.issuerName,
        serialNumber: body.serialNumber,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        thumbprint: body.thumbprint,
        pfxFileId: body.pfxFileId,
        pfxPassword: body.pfxPassword,
        cloudProviderId: body.cloudProviderId,
        alertDaysBefore: body.alertDaysBefore,
        isDefault: body.isDefault,
        allowedModules: body.allowedModules,
      });

      return reply.status(201).send({
        certificate: digitalCertificateToDTO(certificate),
      });
    },
  });
}
