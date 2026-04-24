import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listArtifactsQuerySchema,
  listArtifactsResponseSchema,
} from '@/http/schemas/hr/compliance/list-artifacts.schema';
import { makeListComplianceArtifactsUseCase } from '@/use-cases/hr/compliance/factories/make-list-compliance-artifacts';

/**
 * GET /v1/hr/compliance/artifacts
 *
 * Listagem paginada (infinite scroll no frontend) de artefatos de compliance
 * Portaria 671 já gerados. Suporta filtros por tipo, competência, janela de
 * período e `employeeId` (match no JSON `filters`).
 *
 * Permissão: `hr.compliance.access` (D-08: admin-only; RH recebe via admin
 * group; funcionários comuns não enxergam o dashboard).
 *
 * Response: `{ items: ComplianceArtifactDTO[], meta: { page, limit, total, pages } }`.
 *
 * ADR-026: preHandler (NUNCA onRequest).
 */
export async function v1ListComplianceArtifactsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/compliance/artifacts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.ACCESS,
        resource: 'hr-compliance',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary: 'Listar artefatos de compliance (AFD/AFDT/Folha/Recibo/S1200)',
      description:
        'Listagem paginada com filtros opcionais por tipo / competência / período / funcionário. Usado pelo dashboard /hr/compliance.',
      querystring: listArtifactsQuerySchema,
      response: {
        200: listArtifactsResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListComplianceArtifactsUseCase();
      const result = await useCase.execute({
        tenantId,
        type: query.type,
        competencia: query.competencia,
        periodStart: query.periodStart
          ? new Date(`${query.periodStart}T00:00:00.000Z`)
          : undefined,
        periodEnd: query.periodEnd
          ? new Date(`${query.periodEnd}T23:59:59.999Z`)
          : undefined,
        employeeId: query.employeeId,
        page: query.page,
        limit: query.limit,
      });

      return reply.status(200).send(result);
    },
  });
}
