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
  generateAfdtBodySchema,
  generateArtifactResponseSchema,
} from '@/http/schemas/hr/compliance/generate-afdt.schema';
import { prisma } from '@/lib/prisma';
import { makeGenerateAfdtUseCase } from '@/use-cases/hr/compliance/factories/make-generate-afdt';

import { buildAfdDataset } from './build-afd-dataset';

/**
 * POST /v1/hr/compliance/afdt
 *
 * Gera um AFDT (produto proprietário OpenSea — D-05): mesmo layout do AFD
 * oficial + registros tipo 7 de correções aprovadas (`ADJUSTMENT_APPROVED`),
 * com rastreabilidade no DB (`TimeEntry.originNsrNumber`). Persiste como
 * `ComplianceArtifact(type=AFDT)`.
 *
 * **NÃO é o leiaute AEJ** (que substituiu o AFDT na Portaria MTP 671/2021).
 * O artefato legal exigido em auditoria continua sendo o AFD. AFDT é para
 * conferência trabalhista interna. Documentação visível ao RH: tooltip no
 * dashboard `/hr/compliance` (Plan 06-06).
 *
 * Permissão: `hr.compliance.afdt.generate` (DISTINTA de `afd.generate` —
 * user com só AFD é negado aqui com 403, validado em e2e).
 *
 * Mesmos filtros do AFD (período + cnpj + departmentIds + employeeId).
 * Diferença: o use case NÃO filtra `ADJUSTMENT_APPROVED` — inclui tudo.
 *
 * ADR-026: preHandler (NUNCA onRequest).
 */
export async function v1GenerateAfdtController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/compliance/afdt',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.AFDT_GENERATE,
        resource: 'hr-compliance-afdt',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary:
        'Gerar AFDT (Arquivo Fonte de Dados Tratado) — artefato proprietário OpenSea',
      description:
        'AFDT é o artefato proprietário que estende o AFD com linhas de correções aprovadas. NÃO é o leiaute AEJ oficial — o artefato legal em auditoria é o AFD. Usar para conferência trabalhista interna.',
      body: generateAfdtBodySchema,
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

        const useCase = makeGenerateAfdtUseCase();
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

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPLIANCE_ARTIFACT_GENERATED,
          entityId: result.artifactId,
          placeholders: {
            userName: generatedBy,
            type: 'AFDT',
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
