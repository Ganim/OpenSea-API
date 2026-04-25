import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import {
  posCashMovementResponseSchema,
  posCashMovementTypeEnum,
} from '@/http/schemas/sales/pos/pos-cash-movement.schema';
import { posCashMovementToDTO } from '@/mappers/sales/pos-cash-movement/pos-cash-movement-to-dto';
import { makeCreatePosCashMovementFromDeviceUseCase } from '@/use-cases/sales/pos-cash-movements/factories/make-create-pos-cash-movement-from-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const cashMovementFromDeviceSchema = z.object({
  sessionId: z.string().uuid(),
  type: posCashMovementTypeEnum,
  amount: z.number().positive(),
  reason: z.string().max(256).optional(),
  performedByEmployeeId: z.string().uuid(),
});

export async function v1CashMovementFromDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/device/cash/movement',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Cash'],
      summary:
        'Record a cash movement from a paired device (device-token auth)',
      body: cashMovementFromDeviceSchema,
      response: {
        201: z.object({ movement: posCashMovementResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const device = request.device!;
      const data = request.body;

      try {
        const useCase = makeCreatePosCashMovementFromDeviceUseCase();
        const result = await useCase.execute({
          tenantId: device.tenantId,
          terminalId: device.terminalId,
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
