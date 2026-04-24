import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  punchApprovalParamsSchema,
  resolvePunchApprovalBodySchema,
  resolvePunchApprovalResponseSchema,
} from '@/http/schemas/hr/punch/punch-approval.schema';
import { makeResolvePunchApprovalUseCase } from '@/use-cases/hr/punch-approvals/factories/make-resolve-punch-approval-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-approvals/:id/resolve
 *
 * Gestor aprova ou rejeita uma PunchApproval PENDING. Transição é terminal:
 * chamar de novo com decisão diferente retorna 400 (preserva audit trail
 * conforme Portaria 671 — correções devem ser feitas criando nova batida
 * via `ExecutePunchUseCase`).
 *
 * Permissão: hr.punch-approvals.admin (T-04-13)
 *
 * Auditoria (T-04-16): logAudit com `PUNCH_APPROVAL_RESOLVED` após sucesso
 * incluindo quem resolveu e qual foi a decisão.
 */
export async function v1ResolvePunchApprovalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-approvals/:id/resolve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
        resource: 'hr-punch-approvals',
      }),
    ],
    schema: {
      tags: ['HR - Punch Approvals'],
      summary: 'Resolver (aprovar ou rejeitar) uma aprovação de ponto',
      description:
        'Transição terminal: não é possível re-resolver. 400 se já resolvida ou decisão inválida. 404 se id não existe no tenant.',
      params: punchApprovalParamsSchema,
      body: resolvePunchApprovalBodySchema,
      response: {
        200: resolvePunchApprovalResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const resolverUserId = request.user.sub;

        const useCase = makeResolvePunchApprovalUseCase();
        const result = await useCase.execute({
          tenantId,
          approvalId: request.params.id,
          decision: request.body.decision,
          resolverUserId,
          note: request.body.note,
          // Phase 7 / Plan 07-03 — D-10: passa através para o use case.
          // Ausentes no body → use case apenas ignora (sem headObject call).
          evidenceFileKeys: request.body.evidenceFileKeys,
          linkedRequestId: request.body.linkedRequestId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_APPROVAL_RESOLVED,
          entityId: result.approvalId,
          placeholders: {
            userName: resolverUserId,
            status: result.status === 'APPROVED' ? 'aprovou' : 'rejeitou',
            employeeName: result.approvalId,
          },
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
