import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ocrBatchResponseSchema } from '@/http/schemas/finance';
import { makeOcrExtractDataUseCase } from '@/use-cases/finance/entries/factories/make-ocr-extract-data';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function ocrUploadBatchController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/ocr/upload-batch',
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
      summary: 'Extract financial data from multiple uploaded files via OCR',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: ocrBatchResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const files = request.files();
      const results: z.infer<typeof ocrBatchResponseSchema>['results'] = [];
      let fileCount = 0;

      for await (const file of files) {
        fileCount++;

        if (fileCount > MAX_FILES) {
          return reply.status(400).send({
            code: ErrorCodes.BAD_REQUEST,
            message: `Limite de ${MAX_FILES} arquivos por lote excedido.`,
            requestId: request.requestId,
          });
        }

        const filename = file.filename;

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          results.push({
            filename,
            extractedData: {},
            confidence: 0,
            error:
              'Tipo de arquivo não suportado. Envie JPEG, PNG, WebP ou PDF.',
          });
          continue;
        }

        try {
          const buffer = await file.toBuffer();

          if (buffer.length > MAX_FILE_SIZE) {
            results.push({
              filename,
              extractedData: {},
              confidence: 0,
              error: 'Arquivo muito grande. Limite de 10MB.',
            });
            continue;
          }

          const useCase = makeOcrExtractDataUseCase();
          const result = await useCase.execute({
            buffer,
            mimeType: file.mimetype,
            tenantId,
          });

          results.push({
            filename,
            extractedData: result.extractedData,
            confidence: result.confidence,
          });
        } catch (err) {
          results.push({
            filename,
            extractedData: {},
            confidence: 0,
            error:
              err instanceof Error
                ? err.message
                : 'Erro desconhecido ao processar arquivo.',
          });
        }
      }

      if (fileCount === 0) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message: 'Nenhum arquivo enviado.',
          requestId: request.requestId,
        });
      }

      return reply.status(200).send({ results });
    },
  });
}
