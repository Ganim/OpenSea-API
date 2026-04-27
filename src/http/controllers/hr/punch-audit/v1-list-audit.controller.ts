/**
 * Phase 9 / Plan 09-02 — GET /v1/hr/punch/audit
 * Filters: face_match, gps, drift, fingerprint. Cursor pagination.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { makeListAuditUseCase } from '@/use-cases/hr/punch-audit/factories/make-list-audit-use-case';

const ListAuditQuerySchema = z.object({
  faceMatch_includeLow: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  faceMatch_includeFail3x: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  gps_outOfGeofence: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  gps_gpsInconsistent: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  gps_accuracyAbove100: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  gps_velocityAnomaly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  gps_suspectMock: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  drift_minDriftSec: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  matchMode: z.enum(['or', 'and']).optional().default('or'),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 20)),
});

export async function v1ListAuditController(app: FastifyInstance) {
  app.get(
    '/v1/hr/punch/audit',
    {
      schema: {
        tags: ['HR / Punch Audit'],
        summary: 'List punch audit entries with filtering',
        querystring: {
          type: 'object',
          properties: {
            faceMatch_includeLow: { type: 'string', enum: ['true', 'false'] },
            faceMatch_includeFail3x: {
              type: 'string',
              enum: ['true', 'false'],
            },
            gps_outOfGeofence: { type: 'string', enum: ['true', 'false'] },
            gps_gpsInconsistent: { type: 'string', enum: ['true', 'false'] },
            gps_accuracyAbove100: { type: 'string', enum: ['true', 'false'] },
            gps_velocityAnomaly: { type: 'string', enum: ['true', 'false'] },
            gps_suspectMock: { type: 'string', enum: ['true', 'false'] },
            drift_minDriftSec: { type: 'string' },
            matchMode: { type: 'string', enum: ['or', 'and'] },
            cursor: { type: 'string' },
            limit: { type: 'string' },
          },
        },
      },
      preHandler: [
        verifyJwt,
        verifyTenant,
        createPermissionMiddleware({
          permission: 'hr.punch.audit.access',
        }),
      ],
    },
    async (request, reply) => {
      const parsed = ListAuditQuerySchema.parse(request.query);

      const useCase = makeListAuditUseCase();

      const result = await useCase.execute({
        tenantId: request.user.tenantId,
        filters: {
          faceMatch: {
            includeLow: parsed.faceMatch_includeLow,
            includeFail3x: parsed.faceMatch_includeFail3x,
          },
          gps: {
            outOfGeofence: parsed.gps_outOfGeofence,
            gpsInconsistent: parsed.gps_gpsInconsistent,
            accuracyAbove100: parsed.gps_accuracyAbove100,
            velocityAnomaly: parsed.gps_velocityAnomaly,
            suspectMock: parsed.gps_suspectMock,
          },
          drift: {
            minDriftSec: parsed.drift_minDriftSec,
          },
        },
        matchMode: parsed.matchMode,
        cursor: parsed.cursor,
        limit: parsed.limit,
      });

      reply.send(result);
    },
  );
}
