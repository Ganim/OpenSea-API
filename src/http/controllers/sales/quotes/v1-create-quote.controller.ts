import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createQuoteSchema,
  quoteResponseSchema,
} from '@/http/schemas/sales/quotes/quote.schema';
import { makeCreateQuoteUseCase } from '@/use-cases/sales/quotes/factories/make-create-quote-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createQuoteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/quotes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.QUOTES.REGISTER,
        resource: 'quotes',
      }),
    ],
    schema: {
      tags: ['Sales - Quotes'],
      summary: 'Create a new quote',
      body: createQuoteSchema,
      response: {
        201: z.object({
          quote: quoteResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateQuoteUseCase();
        const { quote } = await useCase.execute({
          tenantId,
          createdBy: userId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.QUOTE_CREATE,
          entityId: quote.id,
          placeholders: { userName: userId, quoteTitle: quote.title },
          newData: { title: body.title, customerId: body.customerId },
        });

        return reply.status(201).send({ quote });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
