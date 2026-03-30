import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, shiftAssignmentResponseSchema } from '@/http/schemas';
import { shiftAssignmentToDTO } from '@/mappers/hr/shift-assignment/shift-assignment-to-dto';
import { makeListAssignmentsByShiftUseCase } from '@/use-cases/hr/shift-assignments/factories/make-list-assignments-by-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListShiftAssignmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/shifts/:shiftId/assignments',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'List shift assignments',
      description: 'Lists all employee assignments for a specific shift',
      params: z.object({
        shiftId: idSchema,
      }),
      response: {
        200: z.object({
          shiftAssignments: z.array(shiftAssignmentResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { shiftId } = request.params;

      const listAssignmentsUseCase = makeListAssignmentsByShiftUseCase();
      const { shiftAssignments } = await listAssignmentsUseCase.execute({
        shiftId,
        tenantId,
      });

      return reply.status(200).send({
        shiftAssignments: shiftAssignments.map(shiftAssignmentToDTO),
      });
    },
  });
}
