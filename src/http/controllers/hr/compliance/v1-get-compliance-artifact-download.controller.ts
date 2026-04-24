import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  downloadArtifactParamsSchema,
  downloadArtifactResponseSchema,
} from '@/http/schemas/hr/compliance/list-artifacts.schema';
import { prisma } from '@/lib/prisma';
import { makeGetComplianceArtifactDownloadUrlUseCase } from '@/use-cases/hr/compliance/factories/make-get-compliance-artifact-download-url';

/**
 * GET /v1/hr/compliance/artifacts/:id/download
 *
 * Gera presigned URL (TTL 15min) para download de artefato existente. Retorna
 * `{ url, expiresAt }` em JSON 200 (frontend abre via `window.open`) — a gente
 * evita `reply.redirect(307)` porque alguns browsers bloqueiam o redirect
 * cross-origin para R2/S3 por causa de CORS.
 *
 * Permissão: `hr.compliance.artifact.download`.
 *
 * Audit log: `COMPLIANCE_ARTIFACT_DOWNLOADED` com `entity=COMPLIANCE_ARTIFACT,
 * entityId=artifactId`. Template usa apenas IDs/labels (T-06-01-02 — sem PII).
 *
 * Cross-tenant isolation: retorna 404 quando o id pertence a outro tenant
 * (ver `GetComplianceArtifactDownloadUrlUseCase` → repo.findById com tenant
 * guard). Nunca confirma a existência do artifact fora do tenant.
 *
 * ADR-026: preHandler (NUNCA onRequest).
 */
export async function v1GetComplianceArtifactDownloadController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/compliance/artifacts/:id/download',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.ARTIFACT_DOWNLOAD,
        resource: 'hr-compliance-artifact',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary: 'Gerar URL presigned (TTL 15min) para baixar artefato',
      description:
        'Retorna um URL presigned (15min) para o blob R2/S3 com Content-Disposition amigável por tipo. Frontend abre via window.open. Audit log grava o evento.',
      params: downloadArtifactParamsSchema,
      response: {
        200: downloadArtifactResponseSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        // Busca o CNPJ do empregador (para compor filename amigável de
        // AFD/AFDT). Fallback: quando EsocialConfig não existe, usamos
        // 'CNPJ' literal no filename — não impede o download.
        const esocialConfig = await prisma.esocialConfig.findUnique({
          where: { tenantId },
          select: { employerDocument: true },
        });

        const employerCnpj =
          esocialConfig?.employerDocument?.replace(/\D/g, '') ?? undefined;

        const useCase = makeGetComplianceArtifactDownloadUrlUseCase();
        const result = await useCase.execute({
          tenantId,
          artifactId: id,
          employerCnpj,
        });

        // Audit log — T-06-01-02: sem PII (apenas type + artifactId).
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPLIANCE_ARTIFACT_DOWNLOADED,
          entityId: id,
          placeholders: {
            userName: userId,
            type: result.artifactType,
            artifactId: id,
          },
        });

        return reply.status(200).send({
          url: result.url,
          expiresAt: result.expiresAt,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
