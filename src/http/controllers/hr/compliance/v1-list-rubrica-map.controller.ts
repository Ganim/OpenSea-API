import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listRubricaMapResponse } from '@/http/schemas/hr/compliance/rubrica-map.schema';
import { makeListRubricaMapUseCase } from '@/use-cases/hr/compliance/factories/make-list-rubrica-map';

/**
 * GET /v1/hr/compliance/esocial-rubricas
 *
 * Lista mapeamentos CLT concept → codRubr eSocial do tenant + `gaps`
 * (conceitos obrigatórios HE_50/HE_100/DSR ainda não configurados).
 *
 * Permissão: `hr.compliance.config.modify` (a UI é a mesma do upsert; ler +
 * escrever ficam atrás da mesma permission — simplicidade RBAC).
 */
export async function v1ListRubricaMapController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/compliance/esocial-rubricas',
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
      summary: 'Listar mapeamentos de rubricas CLT → eSocial',
      description:
        'Retorna os mapeamentos CLT concept → codRubr configurados pelo tenant + conceitos obrigatórios ausentes (gaps).',
      response: {
        200: listRubricaMapResponse,
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const useCase = makeListRubricaMapUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send({
        items: result.items.map((item) => ({
          id: item.id.toString(),
          clrConcept: item.clrConcept,
          codRubr: item.codRubr,
          ideTabRubr: item.ideTabRubr,
          indApurIR: item.indApurIR ?? null,
          updatedBy: item.updatedBy.toString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        gaps: result.gaps,
      });
    },
  });
}
