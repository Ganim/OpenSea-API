/**
 * POST /v1/hr/punch-bio/enroll-pin
 *
 * Gate D-J1: Admin calls this after agent completes local 3-capture enrollment.
 * Records the enrollment event in the audit log.
 *
 * LGPD invariant PUNCH-BIO-03:
 *   - Body schema uses .strict() → unknown fields (iso_template_blob, etc.) → 400
 *   - No biometric template data is accepted or stored in the API database
 *   - Only quality scores are logged: { qualityScores[], avgScore, captureCount }
 *
 * Auth chain (4 middlewares):
 *   1. verifyJwt        — valid tenant-scoped JWT
 *   2. verifyTenant     — tenantId set on request
 *   3. createPermissionMiddleware(hr.bio.enroll) — RBAC gate
 *   4. verifyActionPin  — x-action-pin-token header required (Phase 7 pattern)
 *
 * Plan 10-04 Task 4.3 implementation.
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { verifyActionPin } from '@/http/middlewares/verify-action-pin';
import { prisma } from '@/lib/prisma';
import { EnrollPinUseCase } from '@/use-cases/hr/punch-bio/enroll-pin';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Build the use case with Prisma-backed repositories.
 * Inline factory — lightweight (no dedicated factory file needed for a single endpoint).
 */
function makeEnrollPinUseCase() {
  const employeesRepo = {
    findById: (id: string, tenantId?: string) =>
      prisma.employee.findFirst({
        where: { id, ...(tenantId ? { tenantId } : {}) },
      }),
  };

  const punchDevicesRepo = {
    findById: (id: string, tenantId?: string) =>
      prisma.punchDevice.findFirst({
        where: { id, ...(tenantId ? { tenantId } : {}) },
      }),
  };

  const auditLogsRepo = {
    log: async (entry: {
      tenantId: string;
      userId: string;
      action: string;
      entity: string;
      entityId: string;
      newData: Record<string, unknown>;
    }) => {
      const log = await prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          action: entry.action as never,
          entity: entry.entity as never,
          module: 'HR' as never, // AuditModule.HR — required field
          entityId: entry.entityId,
          newData: entry.newData,
          description: `Enrollment biométrico registrado: device=${entry.entityId}`,
        },
      });
      return { id: log.id };
    },
  };

  return new EnrollPinUseCase(employeesRepo, punchDevicesRepo, auditLogsRepo);
}

export async function v1EnrollPinController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch-bio/enroll-pin',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_BIO.ENROLL,
        resource: 'hr-punch-bio',
      }),
      verifyActionPin,
    ],
    schema: {
      tags: ['HR - Punch Bio'],
      summary: 'Registrar enrollment biométrico do funcionário',
      description:
        'Autoriza e registra o enrollment local de digital no Punch-Agent. ' +
        'Requer PIN de ação (x-action-pin-token). ' +
        'LGPD: nenhum template biométrico é aceito ou armazenado nesta API — apenas scores de qualidade.',
      body: z
        .object({
          deviceId: z.string().uuid(),
          targetEmployeeId: z.string().uuid(),
          qualityScores: z.array(z.number().min(0).max(100)).length(3),
          avgScore: z.number().min(0).max(100),
        })
        .strict(), // .strict() rejects unknown fields — defense in depth LGPD (T-10-04-02)
      response: {
        200: z.object({ ok: z.literal(true), auditLogId: z.string() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const actorUserId = request.user.sub;
      const { deviceId, targetEmployeeId, qualityScores, avgScore } =
        request.body;

      try {
        const useCase = makeEnrollPinUseCase();
        const result = await useCase.execute({
          tenantId,
          actorUserId,
          deviceId,
          targetEmployeeId,
          qualityScores,
          avgScore,
        });

        // Audit is written by the use case's auditLogsRepository.log() call.
        // No double-write needed here (use case already persists BIO_ENROLLED).

        return reply.status(200).send(result);
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
