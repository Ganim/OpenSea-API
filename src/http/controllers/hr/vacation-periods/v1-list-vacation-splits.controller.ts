import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListVacationSplitsUseCase } from '@/use-cases/hr/vacation-periods/factories/make-list-vacation-splits-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const vacationSplitResponseSchema = z.object({
  id: z.string().uuid(),
  vacationPeriodId: z.string().uuid(),
  splitNumber: z.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  days: z.number(),
  status: z.string(),
  paymentDate: z.coerce.date().nullable().optional(),
  paymentAmount: z.number().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export async function v1ListVacationSplitsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/vacation-periods/:vacationPeriodId/splits',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.ACCESS,
        resource: 'vacations',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'List vacation splits',
      description: 'Lists all splits (parcelas) for a given vacation period',
      params: z.object({
        vacationPeriodId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          splits: z.array(vacationSplitResponseSchema),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { vacationPeriodId } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeListVacationSplitsUseCase();
        const { splits } = await useCase.execute({
          tenantId,
          vacationPeriodId,
        });

        return reply.status(200).send({
          splits: splits.map((s) => ({
            id: s.id.toString(),
            vacationPeriodId: s.vacationPeriodId.toString(),
            splitNumber: s.splitNumber,
            startDate: s.startDate,
            endDate: s.endDate,
            days: s.days,
            status: s.status,
            paymentDate: s.paymentDate ?? null,
            paymentAmount: s.paymentAmount ?? null,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          })),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
