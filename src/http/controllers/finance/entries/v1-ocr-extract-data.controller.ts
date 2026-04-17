import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  ocrExtractTextSchema,
  ocrExtractResponseSchema,
} from '@/http/schemas/finance';
import { makeOcrExtractDataUseCase } from '@/use-cases/finance/entries/factories/make-ocr-extract-data';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function ocrExtractDataController(app: FastifyInstance) {
  // JSON text endpoint
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/ocr',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Extract financial data from text or uploaded file via OCR',
      security: [{ bearerAuth: [] }],
      body: ocrExtractTextSchema,
      response: {
        200: ocrExtractResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { text } = request.body as { text: string };
      const tenantId = request.user.tenantId!;

      const useCase = makeOcrExtractDataUseCase();
      const result = await useCase.execute({ text, tenantId });

      return reply.status(200).send(result);
    },
  });

  // Multipart file upload endpoint
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/ocr/upload',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Extract financial data from uploaded image/PDF via OCR',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: ocrExtractResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message: 'Nenhum arquivo enviado.',
          requestId: request.requestId,
        });
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];

      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message:
            'Tipo de arquivo não suportado. Envie JPEG, PNG, WebP ou PDF.',
          requestId: request.requestId,
        });
      }

      const buffer = await data.toBuffer();

      // 10MB limit
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message: 'Arquivo muito grande. Limite de 10MB.',
          requestId: request.requestId,
        });
      }

      const useCase = makeOcrExtractDataUseCase();
      const result = await useCase.execute({
        buffer,
        mimeType: data.mimetype,
        tenantId,
      });

      return reply.status(200).send(result);
    },
  });
}
