import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createFaceEnrollmentsBodySchema,
  createFaceEnrollmentsParamsSchema,
  createFaceEnrollmentsResponseSchema,
} from '@/http/schemas/hr/face-enrollment/create-face-enrollments.schema';
import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCreateFaceEnrollmentsUseCase } from '@/use-cases/hr/face-enrollments/factories/make-create-face-enrollments';

/**
 * POST /v1/hr/employees/:id/face-enrollments
 *
 * Admin-triggered face enrollment capture (D-05 / D-07). The flow is:
 *   1. Write the LGPD CONSENT audit log FIRST and capture its id (D-07)
 *   2. Invoke the use case with {consentAuditLogId} so every enrollment
 *      row FKs back to the consent record
 *   3. Write the CREATED audit log after the rows are persisted
 *
 * Permissão: hr.face-enrollment.register
 */
export async function v1CreateFaceEnrollmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/face-enrollments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.FACE_ENROLLMENT.REGISTER,
        resource: 'hr-face-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Face Enrollments'],
      summary: 'Cadastra biometria facial (3-5 fotos) de um funcionário',
      description:
        'Captura admin-assistida com consentimento LGPD obrigatório. Cada embedding (128 floats) é criptografado com AES-256-GCM e persistido com IV próprio. O DTO de resposta NÃO contém embedding/iv/authTag.',
      params: createFaceEnrollmentsParamsSchema,
      body: createFaceEnrollmentsBodySchema,
      response: {
        201: createFaceEnrollmentsResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.params.id;
      const userId = request.user.sub;

      try {
        // Resolve employee to get the name for audit placeholders. Missing
        // employee short-circuits to 404 BEFORE we write any audit entry.
        const employeesRepo = new PrismaEmployeesRepository();
        const employee = await employeesRepo.findById(
          new UniqueEntityID(employeeId),
          tenantId,
        );
        if (!employee) {
          return reply
            .status(404)
            .send({ message: 'Funcionário não encontrado' });
        }

        // STEP 1 — write the CONSENT audit log first (D-07). We use the
        // audit-logs repo directly (not the logAudit helper) because the
        // helper swallows the id; we need it as a FK on every enrollment
        // row for LGPD traceability.
        const auditLogsRepo = new PrismaAuditLogsRepository();
        const consentDescription = `${userId} registrou consentimento LGPD de biometria de ${employee.fullName} (hash: ${request.body.consentTextHash})`;
        const consentLog = await auditLogsRepo.log({
          action: AuditAction.CREATE,
          entity: AuditEntity.FACE_ENROLLMENT,
          module: AuditModule.HR,
          entityId: employeeId,
          description: consentDescription,
          newData: {
            consentTextHash: request.body.consentTextHash,
            photoCount: request.body.embeddings.length,
            _placeholders: {
              userName: userId,
              employeeName: employee.fullName,
              consentTextHash: request.body.consentTextHash,
            },
          },
          tenantId: new UniqueEntityID(tenantId),
          userId: new UniqueEntityID(userId),
          ip: request.ip,
          userAgent: request.headers['user-agent'] ?? null,
          endpoint: request.url.split('?')[0],
          method: request.method,
        });

        // STEP 2 — persist the encrypted enrollment rows linked to the
        // consent audit log id.
        const useCase = makeCreateFaceEnrollmentsUseCase();
        const result = await useCase.execute({
          tenantId,
          employeeId,
          embeddings: request.body.embeddings,
          consentTextHash: request.body.consentTextHash,
          capturedByUserId: userId,
          consentAuditLogId: consentLog.id.toString(),
        });

        // STEP 3 — CREATED audit log (uses the standard helper; return
        // value is irrelevant here).
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_FACE_ENROLLMENT_CREATED,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
            photoCount: result.enrollments.length,
          },
        });

        return reply.status(201).send(result);
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
