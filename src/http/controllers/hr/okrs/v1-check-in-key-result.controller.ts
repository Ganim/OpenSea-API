import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  checkInKeyResultSchema,
  okrCheckInResponseSchema,
} from '@/http/schemas/hr/okrs';
import { cuidSchema } from '@/http/schemas/common.schema';
import { okrCheckInToDTO } from '@/mappers/hr/okr-check-in';
import { makeCheckInKeyResultUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CheckInKeyResultController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/okrs/key-results/:keyResultId/check-ins',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Check-in on a key result',
      description:
        'Creates a check-in, updates the current value, and recalculates objective progress',
      params: z.object({ keyResultId: cuidSchema }),
      body: checkInKeyResultSchema,
      response: {
        201: okrCheckInResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { keyResultId } = request.params;
      const { newValue, note, confidence } = request.body;

      const useCase = makeCheckInKeyResultUseCase();
      const { checkIn } = await useCase.execute({
        tenantId,
        keyResultId,
        employeeId: request.user.sub,
        newValue,
        note,
        confidence,
      });

      return reply.status(201).send(okrCheckInToDTO(checkIn));
    },
  });
}
