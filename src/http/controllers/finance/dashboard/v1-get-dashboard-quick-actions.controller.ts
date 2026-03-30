import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetDashboardQuickActionsUseCase } from '@/use-cases/finance/dashboard/factories/make-get-dashboard-quick-actions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const quickActionSchema = z.object({
  type: z.enum([
    'OVERDUE_PAYMENT',
    'UPCOMING_DUE',
    'PENDING_APPROVAL',
    'UNRECONCILED',
  ]),
  title: z.string(),
  count: z.number(),
  totalAmount: z.number(),
  urgency: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  actionUrl: z.string(),
});

const quickActionsResponseSchema = z.object({
  actions: z.array(quickActionSchema),
  summary: z.object({
    overdueCount: z.number(),
    overdueAmount: z.number(),
    upcomingCount: z.number(),
    upcomingAmount: z.number(),
    pendingApprovalCount: z.number(),
    unreconciledCount: z.number(),
  }),
});

export async function getDashboardQuickActionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard/quick-actions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'dashboard',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary: 'Get dashboard quick actions',
      description:
        'Returns prioritized quick actions for the finance dashboard, including overdue payments, upcoming due dates, pending approvals, and unreconciled items.',
      security: [{ bearerAuth: [] }],
      response: {
        200: quickActionsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetDashboardQuickActionsUseCase();
      const quickActionsResult = await useCase.execute({ tenantId });

      reply.header('Cache-Control', 'private, max-age=30');
      return reply.status(200).send(quickActionsResult);
    },
  });
}
