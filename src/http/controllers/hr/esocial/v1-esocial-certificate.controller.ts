import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  UploadEsocialCertificateUseCase,
  GetEsocialCertificateUseCase,
} from '@/use-cases/hr/esocial/manage-esocial-certificate';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Legacy HR eSocial certificate controller. Kept as defense-in-depth —
 * the live certificate endpoints now live under controllers/esocial/certificates
 * with full RBAC. If this controller is ever re-registered, the middleware
 * below ensures only users with ESOCIAL.CERTIFICATES permissions can access
 * or upload a PFX certificate (P0-08 ops).
 */
export async function v1EsocialCertificateController(app: FastifyInstance) {
  const uploadUseCase = new UploadEsocialCertificateUseCase();
  const getUseCase = new GetEsocialCertificateUseCase();

  // GET certificate info
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/certificate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CERTIFICATES.ACCESS,
        resource: 'esocial-certificates',
      }),
    ],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Get eSocial certificate info',
      description:
        'Returns the certificate metadata (serial, issuer, validity). Does not return the PFX data.',
      response: {
        200: z.any(),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const result = await getUseCase.execute({ tenantId });

        if (!result) {
          return reply
            .status(404)
            .send({ message: 'Certificado não encontrado.' });
        }

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(500).send({ message });
      }
    },
  });

  // POST upload certificate
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/certificate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CERTIFICATES.ADMIN,
        resource: 'esocial-certificates',
      }),
    ],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Upload eSocial certificate',
      description: 'Upload a PFX (PKCS#12) certificate for eSocial XML signing',
      consumes: ['multipart/form-data'],
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;

        // Parse multipart data
        const data = await request.file();
        if (!data) {
          return reply
            .status(400)
            .send({ message: 'Arquivo PFX não enviado.' });
        }

        const pfxBuffer = await data.toBuffer();
        const passphrase =
          (data.fields?.passphrase as { value?: string })?.value || '';

        const result = await uploadUseCase.execute({
          tenantId,
          pfxBuffer,
          passphrase,
        });

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        if (message.includes('expirado') || message.includes('PFX')) {
          return reply.status(400).send({ message });
        }
        return reply.status(500).send({ message });
      }
    },
  });
}
