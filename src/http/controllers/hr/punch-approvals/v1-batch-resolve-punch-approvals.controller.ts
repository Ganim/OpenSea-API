import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { verifyActionPin } from '@/http/middlewares/verify-action-pin';
import {
  batchResolvePunchApprovalsBodySchema,
  batchResolvePunchApprovalsResponseSchema,
} from '@/http/schemas/hr/punch/punch-approval.schema';
import { makeBatchResolvePunchApprovalsUseCase } from '@/use-cases/hr/punch-approvals/factories/make-batch-resolve-punch-approvals';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-approvals/batch-resolve
 *
 * Resolve em lote (até 100 aprovações) com justificativa compartilhada.
 * Phase 7 / Plan 07-03 — D-09.
 *
 * PIN gate: quando `approvalIds.length > 5`, o header `x-action-pin-token`
 * é obrigatório. A checagem é feita INLINE (não via preHandler) porque
 * Fastify não dá acesso ao body parseado no preHandler com Zod type provider
 * — precisamos do body para saber se o PIN é necessário.
 *
 * Permissão: hr.punch-approvals.admin OR hr.punch-approvals.modify.
 *
 * Auditoria: um único audit log por request (PUNCH_APPROVAL_RESOLVED) com
 * `details.approvalIds` contendo a lista + totais. Cada `ResolvePunchApproval`
 * individual emite o evento APPROVAL_RESOLVED (consumers downstream gravam
 * audit fine-grained se quiserem; este log é o de controller-level).
 */
export async function v1BatchResolvePunchApprovalsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-approvals/batch-resolve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createAnyPermissionMiddleware([
        PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
        PermissionCodes.HR.PUNCH_APPROVALS.MODIFY,
      ]),
      // PIN enforcement inline no handler quando approvalIds.length > 5.
    ],
    schema: {
      tags: ['HR - Punch Approvals'],
      summary: 'Resolver aprovações de ponto em lote',
      description:
        'Aprova ou rejeita até 100 aprovações pendentes em uma única request. Lotes > 5 exigem x-action-pin-token válido (D-09). 1 falha não aborta as outras (Promise.allSettled).',
      body: batchResolvePunchApprovalsBodySchema,
      response: {
        200: batchResolvePunchApprovalsResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const resolverUserId = request.user.sub;
      const { approvalIds, decision, note, evidenceFileKeys, linkedRequestId } =
        request.body;

      // PIN gate inline (body-aware — preHandler não serve aqui).
      if (approvalIds.length > 5) {
        await verifyActionPin(request, reply);
        if (reply.sent) return;
      }

      try {
        const useCase = makeBatchResolvePunchApprovalsUseCase();
        const result = await useCase.execute({
          tenantId,
          resolverUserId,
          approvalIds,
          decision,
          note,
          evidenceFileKeys,
          linkedRequestId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_APPROVAL_RESOLVED,
          // `entityId` precisa ser um id concreto para compat com schema
          // AuditLog. Usamos a primeira aprovação; `details` traz a lista
          // completa + totais para reconstrução full do lote.
          entityId: approvalIds[0],
          placeholders: {
            userName: resolverUserId,
            decision:
              decision === 'APPROVE' ? 'aprovou em lote' : 'rejeitou em lote',
            approvalId: `batch(${approvalIds.length})`,
          },
          newData: {
            approvalIds,
            totalSucceeded: result.totalSucceeded,
            totalFailed: result.totalFailed,
            hasEvidence: (evidenceFileKeys?.length ?? 0) > 0,
            linkedRequestId: linkedRequestId ?? null,
          },
        });

        return reply.status(200).send(result);
      } catch (error) {
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
