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
  upsertRubricaMapBodySchema,
  upsertRubricaMapParamsSchema,
  upsertRubricaMapResponse,
} from '@/http/schemas/hr/compliance/rubrica-map.schema';
import { makeUpsertRubricaMapUseCase } from '@/use-cases/hr/compliance/factories/make-upsert-rubrica-map';

/**
 * PUT /v1/hr/compliance/esocial-rubricas/:concept
 *
 * Upsert de mapping CLT → codRubr. `:concept` deve ser um dos valores de
 * `COMPLIANCE_RUBRICA_CONCEPTS`. Retorna 201 se criado, 200 se atualizado.
 *
 * Permissão: `hr.compliance.config.modify`. Audit log grava
 * `COMPLIANCE_GENERATE` (reuso do action existente; a diferenciação fica no
 * `entityId + placeholders.type=RUBRICA_MAP_{concept}`).
 */
export async function v1UpsertRubricaMapController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/compliance/esocial-rubricas/:concept',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.CONFIG_MODIFY,
        resource: 'hr-compliance-rubrica-map',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary: 'Upsert de mapeamento CLT concept → eSocial codRubr',
      description:
        'Cria ou atualiza o mapeamento para um conceito CLT (HE_50, HE_100, DSR, FERIAS, FALTA_JUSTIFICADA, SALARIO_BASE) do tenant autenticado.',
      params: upsertRubricaMapParamsSchema,
      body: upsertRubricaMapBodySchema,
      response: {
        200: upsertRubricaMapResponse,
        201: upsertRubricaMapResponse,
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const updatedBy = request.user.sub;
        const { concept } = request.params;
        const { codRubr, ideTabRubr, indApurIR } = request.body;

        const useCase = makeUpsertRubricaMapUseCase();
        const { rubricaMap, created } = await useCase.execute({
          tenantId,
          clrConcept: concept,
          codRubr,
          ideTabRubr,
          indApurIR,
          updatedBy,
        });

        // WR-05: usa mensagem específica para upsert de rubrica map (action
        // UPDATE) em vez de reutilizar COMPLIANCE_ARTIFACT_GENERATED — assim
        // investigações forenses por "artefatos gerados" não são poluídas com
        // operações de configuração.
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPLIANCE_RUBRICA_MAP_UPSERTED,
          entityId: rubricaMap.id.toString(),
          placeholders: {
            userName: updatedBy,
            concept,
            codRubr,
          },
        });

        const body = {
          id: rubricaMap.id.toString(),
          clrConcept: rubricaMap.clrConcept,
          codRubr: rubricaMap.codRubr,
          ideTabRubr: rubricaMap.ideTabRubr,
          indApurIR: rubricaMap.indApurIR ?? null,
          updatedBy: rubricaMap.updatedBy.toString(),
          updatedAt: rubricaMap.updatedAt.toISOString(),
          created,
        };

        return reply.status(created ? 201 : 200).send(body);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
