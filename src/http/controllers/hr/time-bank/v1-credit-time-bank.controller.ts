import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  creditDebitTimeBankSchema,
  timeBankResponseSchema,
} from '@/http/schemas';
import { timeBankToDTO } from '@/mappers/hr/time-bank/time-bank-to-dto';
import { makeCreditTimeBankUseCase } from '@/use-cases/hr/time-bank/factories/make-credit-time-bank-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function creditTimeBankController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/time-bank/credit',
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
      summary: 'Credit hours to time bank',
      description: 'Adds hours to an employee time bank',
      body: creditDebitTimeBankSchema,
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
        const creditTimeBankUseCase = makeCreditTimeBankUseCase();
        const { timeBank } = await creditTimeBankUseCase.execute({
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
