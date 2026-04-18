import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyPunchDeviceTokenOrJwt } from '@/http/middlewares/rbac/verify-punch-device-token-or-jwt';
import {
  executePunchBodySchema,
  executePunchErrorSchema,
  executePunchResponseSchema,
} from '@/http/schemas/hr/punch/execute-punch.schema';
import { timeEntryToDTO } from '@/mappers/hr/time-entry/time-entry-to-dto';
import { makeExecutePunchUseCase } from '@/use-cases/hr/punch/factories/make-execute-punch-use-case';

/**
 * POST /v1/hr/punch/clock — the canonical punch endpoint (D-03).
 *
 * Auth: `verifyPunchDeviceTokenOrJwt` accepts either the
 * `x-punch-device-token` header (kiosk/PWA/biometric reader) or a Bearer
 * JWT. No explicit RBAC check: on the JWT path, every authenticated user
 * already carries the default `hr.time-control.register` permission (see
 * D-08 note in the plan); on the device-token path, the pairing event
 * itself is the authorization gate.
 *
 * Errors are mapped:
 * - `UnauthorizedError` → 401
 * - `ResourceNotFoundError` → 404
 * - `BadRequestError` + generic Error → 400
 */
export async function v1ExecutePunchController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch/clock',
    preHandler: [verifyPunchDeviceTokenOrJwt],
    schema: {
      tags: ['HR - Punch'],
      summary: 'Bater ponto (endpoint unificado JWT OR device-token)',
      description:
        'Endpoint unificado de batida de ponto. Aceita autenticação via JWT ' +
        '(funcionário batendo pelo próprio app/web) OU via header ' +
        '`x-punch-device-token` (kiosk/PWA público/leitor biométrico). ' +
        'O servidor infere `entryType` a partir da última batida do dia ' +
        'quando o client não envia. Batidas fora de geofence são gravadas ' +
        'com NSR e uma `PunchApproval` PENDING é criada em paralelo.',
      body: executePunchBodySchema,
      response: {
        201: executePunchResponseSchema,
        400: executePunchErrorSchema,
        401: executePunchErrorSchema,
        404: executePunchErrorSchema,
      },
      security: [{ bearerAuth: [] }, { punchDeviceToken: [] }],
    },
    handler: async (request, reply) => {
      try {
        const isDeviceAuth = !!request.punchDevice;
        const tenantId = isDeviceAuth
          ? request.punchDevice!.tenantId
          : (request.user.tenantId as string);

        const useCase = makeExecutePunchUseCase();
        const result = await useCase.execute({
          tenantId,
          invokingUserId: !isDeviceAuth ? request.user.sub : undefined,
          punchDeviceId: isDeviceAuth ? request.punchDevice!.id : undefined,
          employeeId: request.body.employeeId,
          entryType: request.body.entryType,
          timestamp: request.body.timestamp
            ? new Date(request.body.timestamp)
            : undefined,
          latitude: request.body.latitude,
          longitude: request.body.longitude,
          ipAddress: request.body.ipAddress ?? request.ip,
          notes: request.body.notes,
          requestId: request.body.requestId,
        });

        // Idempotent replays do NOT re-audit — the original punch was
        // already audited and re-auditing the same event would pollute
        // the timeline with noise.
        if (!result.idempotentHit) {
          await logAudit(request, {
            message: AUDIT_MESSAGES.HR.PUNCH_REGISTERED,
            entityId: result.timeEntry.id.toString(),
            placeholders: {
              employeeName: result.timeEntry.employeeId.toString(),
              time: result.timeEntry.timestamp.toISOString(),
              nsrNumber: String(result.nsrNumber),
            },
          });
          for (const approval of result.approvalsCreated) {
            await logAudit(request, {
              message: AUDIT_MESSAGES.HR.PUNCH_APPROVAL_CREATED,
              entityId: approval.id,
              placeholders: {
                employeeName: result.timeEntry.employeeId.toString(),
                reason: approval.reason,
              },
            });
          }
        }

        return reply.status(201).send({
          timeEntry: timeEntryToDTO(result.timeEntry),
          nsrNumber: result.nsrNumber,
          approvalsCreated: result.approvalsCreated,
          idempotentHit: result.idempotentHit,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
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
