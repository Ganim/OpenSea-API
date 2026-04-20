import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  generateBadgePdfErrorResponseSchema,
  generateBadgePdfParamsSchema,
} from '@/http/schemas/hr/badge/generate-badge-pdf.schema';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeGenerateBadgePdfUseCase } from '@/use-cases/hr/badges/factories/make-generate-badge-pdf';

/**
 * POST /v1/hr/employees/:id/badge-pdf
 *
 * Individual crachá PDF generation (D-12 / D-14 individual). RH receives
 * the 85×54mm ID-1 PDF as `application/pdf`. EVERY call rotates the
 * employee's QR token internally — the previous crachá stops working
 * immediately at the next kiosk scan, matching the D-14 "admin baixa novo
 * crachá na sequência" contract. Audited as PUNCH_QR_TOKEN_ROTATED.
 *
 * Permissão: hr.crachas.print (Phase 5 addition).
 */
export async function v1GenerateBadgePdfController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/badge-pdf',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CRACHAS.PRINT,
        resource: 'hr-crachas',
      }),
    ],
    schema: {
      tags: ['HR - Crachás'],
      summary: 'Gera o crachá PDF individual (85×54 mm) e rotaciona o QR',
      description:
        'Retorna um PDF ID-1 (85×54 mm) com foto, nome, matrícula e QR. A chamada rotaciona o QR do funcionário (D-14 individual) — o crachá anterior deixa de funcionar imediatamente no kiosk. Auditado como PUNCH_QR_TOKEN_ROTATED.',
      params: generateBadgePdfParamsSchema,
      response: {
        // Fastify/zod schema for binary responses: omit the 200 schema and
        // rely on the Content-Type header. 404/403 are JSON.
        404: generateBadgePdfErrorResponseSchema,
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.params.id;
      const userId = request.user.sub;

      try {
        // Lookup employee up-front so the audit carries the name. Prefer a
        // cheap findById over invoking the use case blindly: if the id does
        // not exist we want to 404 BEFORE rotating anything.
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

        const useCase = makeGenerateBadgePdfUseCase();
        const { pdf, filename } = await useCase.execute({
          tenantId,
          employeeId,
          rotatedByUserId: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_QR_TOKEN_ROTATED,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
          },
        });

        return reply
          .status(200)
          .type('application/pdf')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .send(pdf);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
