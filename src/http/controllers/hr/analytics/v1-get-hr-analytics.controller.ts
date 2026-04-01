import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetHRAnalyticsUseCase } from '@/use-cases/hr/analytics/factories/make-get-hr-analytics-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const checkEmployeesAccess = createPermissionMiddleware({
  permissionCode: PermissionCodes.HR.EMPLOYEES.ACCESS,
});

const nameCountSchema = z.object({
  name: z.string(),
  count: z.number(),
});

const hrAnalyticsResponseSchema = z.object({
  totalEmployees: z.number(),
  pendingOvertime: z.number(),
  activeAbsences: z.number(),
  currentPayrollNet: z.number(),
  pendingApprovals: z.number(),
  overdueVacations: z.number(),
  employeesByDepartment: z.array(nameCountSchema),
  employeesByContractType: z.array(nameCountSchema),
  absencesByType: z.array(nameCountSchema),
  payrollTrend: z.array(
    z.object({
      month: z.string(),
      bruto: z.number(),
      liquido: z.number(),
    }),
  ),
  overtimeTrend: z.array(
    z.object({
      month: z.string(),
      horas: z.number(),
      count: z.number(),
    }),
  ),
  bonusesVsDeductions: z.array(
    z.object({
      month: z.string(),
      bonificacoes: z.number(),
      deducoes: z.number(),
    }),
  ),
  turnoverTrend: z.array(
    z.object({
      month: z.string(),
      rate: z.number(),
      terminations: z.number(),
      avgHeadcount: z.number(),
    }),
  ),
  complianceAlerts: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['medical_exam_expiring', 'vacation_overdue']),
      severity: z.enum(['warning', 'critical']),
      employeeId: z.string(),
      employeeName: z.string(),
      description: z.string(),
      detail: z.string(),
      link: z.string(),
    }),
  ),
  birthdaysThisMonth: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      photoUrl: z.string().nullable(),
      birthDate: z.string(),
      departmentName: z.string(),
      dayOfMonth: z.number(),
    }),
  ),
  probationEndings: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      hireDate: z.string(),
      departmentName: z.string(),
      daysRemaining: z.number(),
      probationEndDate: z.string(),
    }),
  ),
});

export async function v1GetHRAnalyticsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/analytics',
    preHandler: [verifyJwt, verifyTenant, checkEmployeesAccess],
    schema: {
      tags: ['HR - Analytics'],
      summary: 'Get HR analytics dashboard data',
      description:
        'Returns aggregated HR analytics data including KPIs, chart data, compliance alerts, birthdays, and probation endings.',
      response: {
        200: hrAnalyticsResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetHRAnalyticsUseCase();
      const result = await useCase.execute({ tenantId });

      reply.header('Cache-Control', 'private, max-age=30');
      return reply.status(200).send(result);
    },
  });
}
