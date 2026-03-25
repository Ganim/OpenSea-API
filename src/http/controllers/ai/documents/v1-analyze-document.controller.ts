import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  analyzeDocumentBodySchema,
  analyzeDocumentResponseSchema,
} from '@/http/schemas/ai/document.schema';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { extractTextFromPdf } from '@/services/ai-documents/pdf-extractor';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeAnalyzeDocumentUseCase } from '@/use-cases/ai/documents/factories/make-analyze-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function analyzeDocumentController(app: FastifyInstance) {
  // ─── JSON body route ───────────────────────────────────────────────
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/documents/analyze',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Documents'],
      summary: 'Analyze a document (edital/licitação) with AI',
      description:
        'Accepts document text for AI analysis. Extracts items, cross-references with stock, and suggests actions.',
      security: [{ bearerAuth: [] }],
      body: analyzeDocumentBodySchema,
      response: {
        200: analyzeDocumentResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissionCodes(
        new UniqueEntityID(userId),
      );

      const useCase = makeAnalyzeDocumentUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        userPermissions,
        content: request.body.content,
        documentType: request.body.documentType,
      });

      return reply.status(200).send(result);
    },
  });

  // ─── Multipart (PDF upload) route ──────────────────────────────────
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/documents/analyze-pdf',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Documents'],
      summary: 'Upload and analyze a PDF document (edital/licitação)',
      description:
        'Accepts a PDF file upload. Extracts text from the PDF, then performs AI analysis with stock cross-referencing.',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: analyzeDocumentResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      // Parse multipart data
      const data = await request.file();

      if (!data) {
        throw new BadRequestError('Nenhum arquivo foi enviado.');
      }

      // Validate file type
      if (data.mimetype !== 'application/pdf') {
        throw new BadRequestError('Apenas arquivos PDF são aceitos.');
      }

      // Read file buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk as Buffer);
      }
      const buffer = Buffer.concat(chunks);

      if (buffer.length === 0) {
        throw new BadRequestError('O arquivo PDF está vazio.');
      }

      // Extract text from PDF
      const content = await extractTextFromPdf(buffer);

      // Read documentType from multipart fields if provided
      const fields = data.fields as Record<
        string,
        { value?: string } | undefined
      >;
      const documentTypeField = fields?.documentType;
      const documentType = documentTypeField?.value as
        | 'EDITAL'
        | 'LICITACAO'
        | 'PREGAO'
        | 'COTACAO'
        | 'OTHER'
        | undefined;

      // Get user permissions
      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissionCodes(
        new UniqueEntityID(userId),
      );

      const useCase = makeAnalyzeDocumentUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        userPermissions,
        content,
        documentType,
      });

      return reply.status(200).send(result);
    },
  });
}
