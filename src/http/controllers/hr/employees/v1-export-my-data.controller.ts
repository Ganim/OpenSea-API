import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * LGPD Subject Access Request (SAR) endpoint.
 *
 * Returns ALL personal data the authenticated user has stored as an Employee
 * in the current tenant. Compliant with LGPD Art. 18, II (right to access).
 *
 * The user can only export their own data. No permission required beyond
 * being authenticated and having an Employee record linked to their User.
 */
export async function v1ExportMyDataController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/my-data',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Employees', 'LGPD'],
      summary: 'Export own personal data (LGPD SAR)',
      description:
        'Returns all personal HR data of the authenticated user (employee record, dependants, vacations, absences, payrolls, medical exams, warnings, bonuses, deductions, time entries). LGPD Art. 18, II compliance.',
      response: {
        200: z.object({
          generatedAt: z.string(),
          tenantId: z.string(),
          employee: z.unknown().nullable(),
          dependants: z.array(z.unknown()),
          vacationPeriods: z.array(z.unknown()),
          absences: z.array(z.unknown()),
          payrolls: z.array(z.unknown()),
          medicalExams: z.array(z.unknown()),
          warnings: z.array(z.unknown()),
          bonuses: z.array(z.unknown()),
          deductions: z.array(z.unknown()),
          timeEntries: z.array(z.unknown()),
          benefitEnrollments: z.array(z.unknown()),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const employee = await prisma.employee.findFirst({
        where: { userId, tenantId, deletedAt: null },
      });

      if (!employee) {
        return reply
          .status(404)
          .send({ message: 'No employee record linked to your user account.' });
      }

      const employeeId = employee.id;

      const [
        dependants,
        vacationPeriods,
        absences,
        payrolls,
        medicalExams,
        warnings,
        bonuses,
        deductions,
        timeEntries,
        benefitEnrollments,
      ] = await Promise.all([
        prisma.employeeDependant.findMany({
          where: { employeeId, tenantId },
        }),
        prisma.vacationPeriod.findMany({
          where: { employeeId, tenantId, deletedAt: null },
          orderBy: { acquisitionStart: 'desc' },
        }),
        prisma.absence.findMany({
          where: { employeeId, tenantId, deletedAt: null },
          orderBy: { startDate: 'desc' },
          take: 500,
        }),
        prisma.payroll.findMany({
          where: { employeeId, tenantId },
          orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }],
        }),
        prisma.medicalExam.findMany({
          where: { employeeId, tenantId },
          orderBy: { examDate: 'desc' },
        }),
        prisma.employeeWarning.findMany({
          where: { employeeId, tenantId, deletedAt: null },
          orderBy: { incidentDate: 'desc' },
        }),
        prisma.bonus.findMany({
          where: { employeeId, tenantId },
          orderBy: { date: 'desc' },
        }),
        prisma.deduction.findMany({
          where: { employeeId, tenantId },
          orderBy: { date: 'desc' },
        }),
        prisma.timeEntry.findMany({
          where: { employeeId, tenantId },
          orderBy: { timestamp: 'desc' },
          take: 1000,
        }),
        prisma.benefitEnrollment.findMany({
          where: { employeeId, tenantId, deletedAt: null },
        }),
      ]);

      return reply.status(200).send({
        generatedAt: new Date().toISOString(),
        tenantId,
        employee,
        dependants,
        vacationPeriods,
        absences,
        payrolls,
        medicalExams,
        warnings,
        bonuses,
        deductions,
        timeEntries,
        benefitEnrollments,
      });
    },
  });
}
