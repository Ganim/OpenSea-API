import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeExchangeRateService } from '@/services/finance/exchange-rate.service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function getExchangeRateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/exchange-rates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Exchange Rates'],
      summary: 'Get exchange rate for a currency',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        currency: z.string().min(3).max(3).default('USD'),
        date: z.string().optional(),
      }),
      response: {
        200: z.object({
          currency: z.string(),
          rate: z.number(),
          date: z.string(),
          source: z.string(),
        }),
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { currency, date: dateStr } = request.query;
      const date = dateStr ? new Date(dateStr) : new Date();

      if (isNaN(date.getTime())) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message: 'Data inválida',
          requestId: request.requestId,
        });
      }

      try {
        const service = makeExchangeRateService();
        const rate = await service.getRate(currency.toUpperCase(), date);

        // Set cache header: 1 hour
        reply.header('Cache-Control', 'public, max-age=3600');

        return reply.status(200).send({
          currency: currency.toUpperCase(),
          rate,
          date: date.toISOString().split('T')[0],
          source: 'BCB',
        });
      } catch (error) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message:
            error instanceof Error ? error.message : 'Erro ao buscar cotação',
          requestId: request.requestId,
        });
      }
    },
  });
}
