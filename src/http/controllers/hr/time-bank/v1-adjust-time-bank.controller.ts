import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { adjustTimeBankSchema, timeBankResponseSchema } from '@/http/schemas';
import { timeBankToDTO } from '@/mappers/hr/time-bank/time-bank-to-dto';
import { makeAdjustTimeBankUseCase } from '@/use-cases/hr/time-bank/factories/make-adjust-time-bank-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function adjustTimeBankController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/time-bank/adjust',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TIME_BANK.MANAGE,
        resource: 'time-bank',
      }),
    ],
    schema: {
      tags: ['HR - Time Bank'],
      summary: 'Adjust time bank balance',
      description: 'Sets the time bank balance to a specific value',
      body: adjustTimeBankSchema,
      response: {
        200: z.object({
          timeBank: timeBankResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const adjustTimeBankUseCase = makeAdjustTimeBankUseCase();
        const { timeBank } = await adjustTimeBankUseCase.execute({
          ...data,
          tenantId,
        });

        return reply.status(200).send({ timeBank: timeBankToDTO(timeBank) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
