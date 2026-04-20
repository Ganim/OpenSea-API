import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listCrachasQuerySchema,
  listCrachasResponseSchema,
} from '@/http/schemas/hr/qr-token/list-crachas.schema';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

/**
 * GET /v1/hr/crachas
 *
 * Admin listing for the crachás panel. Returns paged employees with
 * `rotationStatus` derived server-side from `qrTokenSetAt`:
 *   - `never`  → `qrTokenSetAt IS NULL`
 *   - `recent` → rotated in the last 30 days
 *   - `active` → ever rotated (any `qrTokenSetAt`)
 *
 * Permissão: hr.crachas.print (Phase 5 RBAC).
 */
export async function v1ListCrachasController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/crachas',
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
      summary: 'Lista funcionários com status de rotação do crachá',
      querystring: listCrachasQuerySchema,
      response: {
        200: listCrachasResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { departmentId, rotationStatus, search, page, pageSize } =
        request.query;

      const repo = new PrismaEmployeesRepository();
      const { items, total } = await repo.findAllForCrachas(tenantId, {
        departmentId,
        rotationStatus,
        search,
        page,
        pageSize,
      });

      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const response = {
        items: items.map((item) => {
          let derivedStatus: 'active' | 'recent' | 'never';
          if (!item.qrTokenSetAt) {
            derivedStatus = 'never';
          } else if (now - item.qrTokenSetAt.getTime() <= THIRTY_DAYS_MS) {
            derivedStatus = 'recent';
          } else {
            derivedStatus = 'active';
          }
          return {
            id: item.id,
            fullName: item.fullName,
            registration: item.registration,
            photoUrl: item.photoUrl,
            departmentName: item.departmentName,
            qrTokenSetAt: item.qrTokenSetAt
              ? item.qrTokenSetAt.toISOString()
              : null,
            rotationStatus: derivedStatus,
          };
        }),
        total,
        page,
      };

      return reply.status(200).send(response);
    },
  });
}
