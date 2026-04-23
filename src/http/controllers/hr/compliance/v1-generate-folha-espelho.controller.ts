import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  folhaEspelhoIndividualBody,
  folhaEspelhoIndividualResponse,
} from '@/http/schemas/hr/compliance/generate-folha-espelho.schema';
import { prisma } from '@/lib/prisma';
import { makeGenerateFolhaEspelhoUseCase } from '@/use-cases/hr/compliance/factories/make-generate-folha-espelho';

/**
 * POST /v1/hr/compliance/folhas-espelho
 *
 * Gera folha espelho mensal PDF para 1 funcionário + competência.
 * Operação SÍNCRONA — retorna 201 com artifactId + downloadUrl em ~2-5s.
 *
 * Permissão: `hr.compliance.folha-espelho.generate` (mesma da rota bulk).
 *
 * Fluxo:
 *  1. Zod valida body (employeeId UUID, competencia YYYY-MM).
 *  2. Controller busca Tenant + EsocialConfig (CNPJ) via Prisma.
 *  3. Chama `GenerateFolhaEspelhoUseCase.execute` — use case faz fetch de
 *     Employee + consolidação + render PDF + upload R2 + ComplianceArtifact.
 *  4. Audit log com `entity=COMPLIANCE_ARTIFACT, action=COMPLIANCE_GENERATE`.
 *  5. Retorna { artifactId, downloadUrl, storageKey, sizeBytes, contentHash }.
 *
 * Erros:
 *  - 400 (Zod refine ou BadRequestError — competência inválida)
 *  - 401 (JWT ausente)
 *  - 403 (sem permissão `hr.compliance.folha-espelho.generate`)
 *  - 404 (funcionário não encontrado ou cross-tenant)
 *
 * ADR-026: usa preHandler para toda a cadeia de auth/permissão.
 */
export async function v1GenerateFolhaEspelhoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/compliance/folhas-espelho',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.FOLHA_ESPELHO_GENERATE,
        resource: 'hr-compliance-folha-espelho',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary: 'Gerar folha espelho mensal (individual, síncrono)',
      description:
        'Gera a folha espelho de ponto mensal em PDF (A4 CLT padrão) para 1 funcionário + competência. Cria ComplianceArtifact(type=FOLHA_ESPELHO, filters={employeeId}).',
      body: folhaEspelhoIndividualBody,
      response: {
        201: folhaEspelhoIndividualResponse,
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
        const { employeeId, competencia } = request.body;

        // Resolve tenantContext via Prisma (razaoSocial + CNPJ + endereço)
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true, name: true, settings: true },
        });
        if (!tenant) {
          return reply.status(404).send({ message: 'Tenant não encontrado.' });
        }
        const esocialConfig = await prisma.esocialConfig.findUnique({
          where: { tenantId },
          select: { employerDocument: true },
        });
        const settings = (tenant.settings ?? {}) as Record<string, unknown>;
        const onlyDigits = (v: string | null | undefined) =>
          (v ?? '').replace(/\D/g, '');
        const cnpj =
          (onlyDigits(esocialConfig?.employerDocument).length === 14
            ? onlyDigits(esocialConfig?.employerDocument)
            : null) ??
          (typeof settings.cnpj === 'string' &&
          onlyDigits(settings.cnpj).length === 14
            ? onlyDigits(settings.cnpj)
            : '00000000000000');
        const endereco =
          typeof settings.address === 'string'
            ? (settings.address as string)
            : undefined;

        const useCase = makeGenerateFolhaEspelhoUseCase();
        const result = await useCase.execute({
          tenantId,
          generatedBy,
          employeeId,
          competencia,
          tenantContext: {
            razaoSocial: tenant.name,
            cnpj,
            endereco,
          },
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPLIANCE_ARTIFACT_GENERATED,
          entityId: result.artifactId,
          placeholders: {
            userName: generatedBy,
            type: 'FOLHA_ESPELHO',
            period: competencia,
          },
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
