import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPosCashMovementSchema,
  posCashMovementResponseSchema,
} from '@/http/schemas/sales/pos/pos-cash-movement.schema';
import { posCashMovementToDTO } from '@/mappers/sales/pos-cash-movement/pos-cash-movement-to-dto';
import { makeCreatePosCashMovementUseCase } from '@/use-cases/sales/pos-cash-movements/factories/make-create-pos-cash-movement-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CashMovementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/cash/movement',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.CASH.ACCESS,
        resource: 'pos-cash',
      }),
    ],
    schema: {
      tags: ['POS - Cash'],
      summary: 'Record a cash movement (withdrawal or supply)',
      body: createPosCashMovementSchema,
      response: {
        201: z.object({ movement: posCashMovementResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const performedByUserId = request.user.sub;
      const data = request.body;

      try {
        const useCase = makeCreatePosCashMovementUseCase();
        const result = await useCase.execute({
          tenantId,
          performedByUserId,
          ...data,
        });

        return reply.status(201).send({
          movement: posCashMovementToDTO(result.movement),
        });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
