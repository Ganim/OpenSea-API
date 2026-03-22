import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateReportUseCase } from '@/use-cases/sales/analytics/reports/factories/make-create-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/analytics/reports',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ANALYTICS_REPORTS.REGISTER,
        resource: 'analytics-reports',
      }),
    ],
    schema: {
      tags: ['Sales - Analytics Reports'],
      summary: 'Create a new analytics report',
      body: z.object({
        name: z.string().min(1).max(128),
        type: z.enum([
          'SALES_SUMMARY',
          'COMMISSION_REPORT',
          'PIPELINE_REPORT',
          'PRODUCT_PERFORMANCE',
          'CUSTOMER_ANALYSIS',
          'BID_REPORT',
          'MARKETPLACE_REPORT',
          'CASHIER_REPORT',
          'GOAL_PROGRESS',
          'CURVA_ABC',
          'CUSTOM',
        ]),
        config: z.record(z.string(), z.unknown()).optional(),
        format: z.enum(['PDF', 'EXCEL', 'CSV']),
        dashboardId: z.string().uuid().optional(),
        isScheduled: z.boolean().optional(),
        scheduleFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
        scheduleDayOfWeek: z.number().int().min(0).max(6).optional(),
        scheduleDayOfMonth: z.number().int().min(1).max(28).optional(),
        scheduleHour: z.number().int().min(0).max(23).optional(),
        scheduleTimezone: z.string().max(64).optional(),
        deliveryMethod: z
          .enum(['EMAIL', 'WHATSAPP', 'BOTH', 'DOWNLOAD_ONLY'])
          .optional(),
        recipientUserIds: z.array(z.string().uuid()).optional(),
        recipientEmails: z.array(z.string().email()).optional(),
        recipientPhones: z.array(z.string()).optional(),
      }),
      response: {
        201: z.object({ report: z.any() }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const data = request.body;

      try {
        const useCase = makeCreateReportUseCase();
        const result = await useCase.execute({
          tenantId,
          ...data,
          createdByUserId: userId,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
