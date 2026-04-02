import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCancelVacationSplitUseCase } from '@/use-cases/hr/vacation-periods/factories/make-cancel-vacation-split-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CancelVacationSplitController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/vacation-periods/splits/:splitId/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.MODIFY,
        resource: 'vacations',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Cancel a vacation split',
      description: 'Cancels a scheduled vacation split (parcela)',
      params: z.object({
        splitId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { splitId } = request.params;

      try {
        const useCase = makeCancelVacationSplitUseCase();
        await useCase.execute({ splitId });

        return reply.status(200).send({
          message: 'Parcela de férias cancelada com sucesso',
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
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
