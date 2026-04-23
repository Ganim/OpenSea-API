import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  generateAfdBodySchema,
  generateArtifactResponseSchema,
} from '@/http/schemas/hr/compliance/generate-afd.schema';
import { prisma } from '@/lib/prisma';
import { makeGenerateAfdUseCase } from '@/use-cases/hr/compliance/factories/make-generate-afd';

import { buildAfdDataset } from './build-afd-dataset';

/**
 * POST /v1/hr/compliance/afd
 *
 * Gera um AFD (Arquivo Fonte de Dados) conforme Portaria MTP 671/2021
 * Anexo I (REP-P), byte-a-byte, e persiste como `ComplianceArtifact`.
 *
 * Permissão: `hr.compliance.afd.generate` (AFDT exige permissão separada —
 * ADMIN do módulo compliance cobre as duas via `extractAllCodes`).
 *
 * Filtros suportados no body:
 *  - Período [startDate, endDate] (obrigatório, janela máx 365 dias)
 *  - cnpj (opcional, 14 dígitos numéricos — filtra filial)
 *  - departmentIds (opcional, UUIDs — filtra departamentos)
 *  - employeeId (opcional, UUID — geração individual)
 *
 * Fluxo:
 *  1. Zod valida o body (janela / formato / tamanho arrays).
 *  2. Controller busca Tenant/EsocialConfig/Employees/TimeEntries/Devices
 *     via Prisma (orquestração; use case permanece puro).
 *  3. `GenerateAfdUseCase.execute` filtra `adjustmentType=ORIGINAL`, chama
 *     `buildAfd`, persiste no R2 + grava `ComplianceArtifact`.
 *  4. Audit log com `entity=COMPLIANCE_ARTIFACT, action=COMPLIANCE_GENERATE`.
 *  5. Retorna `{ artifactId, downloadUrl, storageKey, sizeBytes, contentHash }`.
 *
 * Erros:
 *  - 400 (Zod refine ou BadRequestError do use case — janela > 365 dias etc.)
 *  - 401 (JWT ausente)
 *  - 403 (sem permissão hr.compliance.afd.generate)
 *  - 404 (tenant/esocial não configurado — não costuma acontecer)
 *
 * ADR-026: preHandler (NUNCA onRequest).
 */
export async function v1GenerateAfdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/compliance/afd',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.AFD_GENERATE,
        resource: 'hr-compliance-afd',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary:
        'Gerar AFD (Arquivo Fonte de Dados) conforme Portaria MTP 671/2021',
      description:
        'Gera um AFD byte-a-byte (Anexo I REP-P) para o período solicitado, persiste no R2 como ComplianceArtifact e retorna URL presigned (TTL 15min) para download. Correções aprovadas (ADJUSTMENT_APPROVED) NÃO entram no AFD — use /v1/hr/compliance/afdt para o artefato consolidado.',
      body: generateAfdBodySchema,
      response: {
        201: generateArtifactResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const generatedBy = request.user.sub;

        const startDate = new Date(`${request.body.startDate}T00:00:00.000Z`);
        const endDate = new Date(`${request.body.endDate}T23:59:59.999Z`);

        const dataset = await buildAfdDataset({
          prisma,
          tenantId,
          startDate,
          endDate,
          cnpj: request.body.cnpj,
          departmentIds: request.body.departmentIds,
          employeeId: request.body.employeeId,
        });

        const useCase = makeGenerateAfdUseCase();
        const result = await useCase.execute({
          tenantId,
          generatedBy,
          startDate,
          endDate,
          cnpj: request.body.cnpj,
          departmentIds: request.body.departmentIds,
          employeeId: request.body.employeeId,
          dataset,
        });

        // Audit trail — T-06-01-02: templates usam apenas IDs/labels, nenhum PII
        // (filtros ficam dentro de ComplianceArtifact.filters para inspeção admin).
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPLIANCE_ARTIFACT_GENERATED,
          entityId: result.artifactId,
          placeholders: {
            userName: generatedBy,
            type: 'AFD',
            period: `${request.body.startDate}..${request.body.endDate}`,
          },
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error && /não encontrado/i.test(error.message)) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
