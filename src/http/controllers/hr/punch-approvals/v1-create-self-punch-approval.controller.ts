import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EvidenceFileNotFoundError } from '@/@errors/use-cases/evidence-file-not-found-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createSelfPunchApprovalBodySchema,
  createSelfPunchApprovalResponseSchema,
} from '@/http/schemas/hr/punch/punch-approval.schema';
import { makeCreateSelfPunchApprovalUseCase } from '@/use-cases/hr/punch-approvals/factories/make-create-self-punch-approval';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * POST /v1/hr/punch-approvals
 *
 * Phase 8 / Plan 08-01 — D-07/D-08. Funcionário comum cria via PWA pessoal
 * uma `PunchApproval` PENDING para si mesmo. Sem PIN gate (atrito alto vs
 * valor de segurança baixo — funcionário próprio anexando atestado dele
 * mesmo).
 *
 * Permissão: `hr.punch-approvals.access` (NÃO `.admin` — gestor é o único
 * que resolve, mas funcionário comum tem ACCESS por DEFAULT_USER_PERMISSIONS
 * desde Plan 04-02 / D-AD-05).
 *
 * Auditoria: `PUNCH_APPROVAL_CREATED` (mensagem já existente Plan 04-02)
 * com placeholders `userName` e `employeeName` resolvidos pelo `request.user.sub`.
 *
 * Mapeamento de erros:
 *   ResourceNotFoundError      → 404 (Employee/TimeEntry não encontrado)
 *   BadRequestError "Too many" → 429 (rate-limit anti-spam)
 *   BadRequestError outros     → 400 (Zod refine, ownership, evidência)
 *   EvidenceFileNotFoundError  → 400 (phantom key)
 */
export async function v1CreateSelfPunchApprovalController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-approvals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_APPROVALS.ACCESS,
        resource: 'hr-punch-approvals',
      }),
    ],
    schema: {
      tags: ['HR - Punch Approvals'],
      summary:
        'Funcionário cria justificativa própria (PWA pessoal — D-07 trigger manual)',
      description:
        'Endpoint usado pela PWA pessoal para o funcionário antecipar uma justificativa ' +
        '(esqueci de bater, atestado médico, falta com motivo). Resultado é uma ' +
        'PunchApproval PENDING que o gestor resolve via /resolve. Sem PIN gate (D-08). ' +
        'Rate-limit: máx 5 PENDING simultâneas por employee (429 acima disso).',
      body: createSelfPunchApprovalBodySchema,
      response: {
        201: createSelfPunchApprovalResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        429: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const userId = request.user.sub;

        const useCase = makeCreateSelfPunchApprovalUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_APPROVAL_CREATED,
          entityId: result.approvalId,
          placeholders: {
            userName: userId,
            employeeName: userId,
            reason: request.body.reason,
          },
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof EvidenceFileNotFoundError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          if (error.message.includes('Too many pending')) {
            return reply.status(429).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
