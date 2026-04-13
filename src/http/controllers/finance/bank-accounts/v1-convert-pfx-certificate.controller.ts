import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { makeConvertPfxCertificateUseCase } from '@/use-cases/finance/bank-accounts/factories/make-convert-pfx-certificate-use-case';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function convertPfxCertificateController(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/v1/finance/bank-accounts/:id/convert-pfx',
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary:
        'Upload a .pfx/.p12 file + password, converts to PEM cert+key, stores in S3',
      consumes: ['multipart/form-data'],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          certFileId: z.string(),
          keyFileId: z.string(),
        }),
        400: z.object({ message: z.string() }),
      },
    },
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ADMIN,
      }),
    ],
    handler: async (request, reply) => {
      const { id: bankAccountId } = request.params as { id: string };

      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          message: 'Nenhum arquivo enviado. Envie o .pfx como multipart.',
        });
      }

      const pfxBuffer = await data.toBuffer();
      const password =
        (data.fields.password as { value?: string })?.value ?? '';

      if (!password) {
        return reply
          .status(400)
          .send({ message: 'O campo "password" é obrigatório.' });
      }

      const useCase = makeConvertPfxCertificateUseCase();
      const result = await useCase.execute({
        tenantId: request.user.tenantId!,
        bankAccountId,
        pfxBuffer,
        pfxPassword: password,
      });

      return reply.status(200).send(result);
    },
  });
}
