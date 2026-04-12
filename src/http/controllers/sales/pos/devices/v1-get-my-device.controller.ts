import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { verifyDeviceToken } from '@/http/middlewares/rbac/verify-device-token';
import { posSessionResponseSchema } from '@/http/schemas/sales/pos/pos-session.schema';
import { posTerminalResponseSchema } from '@/http/schemas/sales/pos/pos-terminal.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { posTerminalToDTO } from '@/mappers/sales/pos-terminal/pos-terminal-to-dto';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetMyDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/devices/me',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Devices'],
      summary: 'Get the terminal + active session bound to this device',
      response: {
        200: z.object({
          terminal: posTerminalResponseSchema,
          currentSession: posSessionResponseSchema.nullable(),
        }),
        401: z.object({ message: z.string(), code: z.string() }),
      },
    },
    handler: async (request, reply) => {
      if (!request.terminal) {
        throw new UnauthorizedError('Invalid or revoked device token');
      }

      return reply.send({
        terminal: posTerminalToDTO(request.terminal),
        currentSession: request.currentSession
          ? posSessionToDTO(request.currentSession)
          : null,
      });
    },
  });
}
