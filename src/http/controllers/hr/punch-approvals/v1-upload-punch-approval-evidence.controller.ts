import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { verifyActionPin } from '@/http/middlewares/verify-action-pin';
import {
  punchApprovalParamsSchema,
  uploadPunchApprovalEvidenceResponseSchema,
} from '@/http/schemas/hr/punch/punch-approval.schema';
import { makeUploadPunchApprovalEvidenceUseCase } from '@/use-cases/hr/punch-approvals/factories/make-upload-punch-approval-evidence';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-approvals/:id/evidence
 *
 * Upload multipart de evidência PDF (até 10MB) para o PunchApproval.
 * Phase 7 / Plan 07-03 — D-10.
 *
 * Fluxo 2-step:
 *  1. Upload (este endpoint) → retorna `storageKey`.
 *  2. Resolve (PUT /:id/resolve com body `evidenceFileKeys: [storageKey]`)
 *     anexa ao PunchApproval via `attachEvidence()`.
 *
 * PIN sempre obrigatório (mesmo upload avulso — decisão de segurança D-10:
 * upload cria artefato em bucket privado, gera custo e persiste LGPD-
 * sensible metadata).
 *
 * Permissão: hr.punch-approvals.admin OR hr.punch-approvals.modify.
 */
export async function v1UploadPunchApprovalEvidenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-approvals/:id/evidence',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createAnyPermissionMiddleware([
        PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
        PermissionCodes.HR.PUNCH_APPROVALS.MODIFY,
      ]),
      verifyActionPin,
    ],
    schema: {
      tags: ['HR - Punch Approvals'],
      summary: 'Upload de evidência PDF para aprovação de ponto',
      description:
        'Multipart upload (campo `file`) de PDF até 10MB. Requer x-action-pin-token válido. Retorna storageKey usado no body do resolve.',
      params: punchApprovalParamsSchema,
      response: {
        201: uploadPunchApprovalEvidenceResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const uploadedBy = request.user.sub;
      const { id: approvalId } = request.params;

      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ message: 'Arquivo ausente' });
        }
        const buffer = await data.toBuffer();
        const filename = data.filename ?? 'evidence.pdf';
        const mimeType = data.mimetype ?? 'application/octet-stream';

        const useCase = makeUploadPunchApprovalEvidenceUseCase();
        const result = await useCase.execute({
          tenantId,
          approvalId,
          uploadedBy,
          buffer,
          filename,
          mimeType,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
