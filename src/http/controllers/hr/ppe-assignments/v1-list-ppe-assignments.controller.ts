import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPPEAssignmentsQuerySchema,
  ppeAssignmentResponseSchema,
} from '@/http/schemas/hr/safety';
import { ppeAssignmentToDTO } from '@/mappers/hr/ppe-assignment';
import { makeListPPEAssignmentsUseCase } from '@/use-cases/hr/ppe-assignments/factories/make-list-ppe-assignments-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListPPEAssignmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/ppe-assignments',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'List PPE assignments',
      description: 'Lists PPE assignments with optional filters (employee, item, status)',
      querystring: listPPEAssignmentsQuerySchema,
      response: {
        200: z.object({
          assignments: z.array(ppeAssignmentResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListPPEAssignmentsUseCase();
      const { assignments, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        assignments: assignments.map(ppeAssignmentToDTO),
        total,
      });
    },
  });
}
