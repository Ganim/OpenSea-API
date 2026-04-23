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
  folhaEspelhoBulkBody,
  folhaEspelhoBulkResponse,
} from '@/http/schemas/hr/compliance/generate-folha-espelho.schema';
import { makeGenerateFolhaEspelhoBulkUseCase } from '@/use-cases/hr/compliance/factories/make-generate-folha-espelho-bulk';

/**
 * POST /v1/hr/compliance/folhas-espelho/bulk
 *
 * Dispara geração de folhas espelho em LOTE via BullMQ. Retorna 202 com
 * `bulkJobId` + contagem de funcionários. Progresso vem via Socket.IO na
 * room `tenant:{id}:hr` (evento `compliance.folha_espelho.progress` durante,
 * `compliance.folha_espelho.completed` ao final).
 *
 * Permissão: `hr.compliance.folha-espelho.generate` (mesma do individual).
 * NÃO exige PIN — artefato rotineiro, não destrutivo (diferente de S-1200
 * submit).
 *
 * Scopes (Zod enforça):
 *  - `ALL`         → todos funcionários ativos do tenant
 *  - `DEPARTMENT`  → departmentIds[] obrigatório
 *  - `CUSTOM`      → employeeIds[] obrigatório (max 500)
 *
 * Erros:
 *  - 400 (Zod refine — scope sem arrays complementares, > 500 funcionários
 *    resolvidos, competência inválida)
 *  - 401 (JWT ausente)
 *  - 403 (sem permissão)
 *  - 202 (enqueued com bulkJobId)
 *
 * ADR-026: preHandler (NUNCA onRequest).
 */
export async function v1GenerateFolhaEspelhoBulkController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/compliance/folhas-espelho/bulk',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.FOLHA_ESPELHO_GENERATE,
        resource: 'hr-compliance-folha-espelho-bulk',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary: 'Gerar folhas espelho em lote (BullMQ + Socket.IO progress)',
      description:
        'Dispatcher BullMQ. Retorna 202 com bulkJobId; front-end subscreve tenant:{id}:hr e recebe compliance.folha_espelho.progress/completed.',
      body: folhaEspelhoBulkBody,
      response: {
        202: folhaEspelhoBulkResponse,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const requestedBy = request.user.sub;
        const { scope, departmentIds, employeeIds, competencia } = request.body;

        const useCase = makeGenerateFolhaEspelhoBulkUseCase();
        const result = await useCase.execute({
          tenantId,
          requestedBy,
          competencia,
          scope,
          departmentIds,
          employeeIds,
        });

        // Audit log: registra apenas o dispatch (não aguarda o worker
        // completar). Worker escreve audit próprio para cada folha gerada
        // via o use case individual.
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPLIANCE_ARTIFACT_GENERATED,
          entityId: result.bulkJobId,
          placeholders: {
            userName: requestedBy,
            type: `FOLHA_ESPELHO_BULK(${result.employeeCount})`,
            period: competencia,
          },
        });

        return reply.status(202).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
