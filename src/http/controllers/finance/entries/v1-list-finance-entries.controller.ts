import { PermissionCodes } from '@/constants/rbac';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  financeEntryResponseSchema,
  listFinanceEntriesQuerySchema,
} from '@/http/schemas/finance';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeListFinanceEntriesUseCase } from '@/use-cases/finance/entries/factories/make-list-finance-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listFinanceEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createAnyPermissionMiddleware([
        PermissionCodes.FINANCE.ENTRIES.ACCESS,
        PermissionCodes.FINANCE.ENTRIES.ONLYSELF,
      ]),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'List finance entries',
      security: [{ bearerAuth: [] }],
      querystring: listFinanceEntriesQuerySchema,
      response: {
        200: z.object({
          entries: z.array(financeEntryResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      // Check if user has full ACCESS or only ONLYSELF
      const permissionService = getPermissionService();
      const accessResult = await permissionService.checkPermission({
        userId: new UniqueEntityID(userId),
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
      });

      const hasFullAccess = accessResult.allowed;

      const useCase = makeListFinanceEntriesUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.query,
        // If user only has ONLYSELF (not full ACCESS), filter by their userId
        createdByUserId: hasFullAccess ? undefined : userId,
      });

      return reply.status(200).send(result);
    },
  });
}
