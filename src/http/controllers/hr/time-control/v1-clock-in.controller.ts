import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { clockInOutSchema, timeEntryResponseSchema } from '@/http/schemas';
import { timeEntryToDTO } from '@/mappers/hr/time-entry/time-entry-to-dto';
import { makeClockInUseCase } from '@/use-cases/hr/time-control/factories/make-clock-in-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * @deprecated Use the unified endpoint `POST /v1/hr/punch/clock`
 * (Plan 04-04). Legacy route is preserved until phase 6/7 removes it
 * together with `ClockInUseCase`.
 *
 * New clients MUST NOT bind to this route — it will return 404 once
 * removed. Audit-wise, punches recorded through this route share the
 * same NSR sequence as the unified endpoint, so no data migration is
 * required at cutover.
 */
export async function v1ClockInController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/time-control/clock-in',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_CONTROL.REGISTER,
        resource: 'time-control',
      }),
    ],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'Register clock in',
      description: 'Registers a clock-in entry for an employee',
      body: clockInOutSchema,
      response: {
        201: z.object({
          timeEntry: timeEntryResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;
      const tenantId = request.user.tenantId!;

      try {
        const clockInUseCase = makeClockInUseCase();
        const { timeEntry } = await clockInUseCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TIME_CLOCK_IN,
          entityId: timeEntry.id.toString(),
          placeholders: {
            employeeName: timeEntry.employeeId.toString(),
            time: timeEntry.timestamp.toISOString(),
          },
        });

        return reply.status(201).send({ timeEntry: timeEntryToDTO(timeEntry) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
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
