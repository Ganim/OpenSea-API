import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Employee label data presenter schema
 */
const employeeLabelDataSchema = z.object({
  employee: z.object({
    id: z.string(),
    registrationNumber: z.string(),
    fullName: z.string(),
    socialName: z.string().nullable(),
    cpf: z.string(),
    hireDate: z.coerce.date(),
    status: z.string(),
    photoUrl: z.string().nullable(),
  }),
  department: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  position: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  company: z
    .object({
      id: z.string(),
      name: z.string(),
      cnpj: z.string().nullable(),
    })
    .nullable(),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export async function getEmployeesLabelDataController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/label-data',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.LIST,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Get label data for multiple employees (presenter)',
      body: z.object({
        employeeIds: z.array(z.string().uuid()).min(1).max(100),
      }),
      response: {
        200: z.object({
          labelData: z.array(employeeLabelDataSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeIds } = request.body;

      const employees = await prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          tenantId,
          deletedAt: null,
        },
        include: {
          department: {
            select: { id: true, name: true },
          },
          position: {
            select: { id: true, name: true },
          },
          company: {
            select: { id: true, legalName: true, cnpj: true },
          },
        },
      });

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      });

      const labelData = employees.map((emp) => ({
        employee: {
          id: emp.id,
          registrationNumber: emp.registrationNumber,
          fullName: emp.fullName,
          socialName: emp.socialName,
          cpf: emp.cpf,
          hireDate: emp.hireDate,
          status: emp.status,
          photoUrl: emp.photoUrl,
        },
        department: emp.department
          ? { id: emp.department.id, name: emp.department.name }
          : null,
        position: emp.position
          ? { id: emp.position.id, name: emp.position.name }
          : null,
        company: emp.company
          ? {
              id: emp.company.id,
              name: emp.company.legalName,
              cnpj: emp.company.cnpj,
            }
          : null,
        tenant: {
          id: tenant?.id ?? tenantId,
          name: tenant?.name ?? '',
        },
      }));

      return reply.status(200).send({ labelData });
    },
  });
}
