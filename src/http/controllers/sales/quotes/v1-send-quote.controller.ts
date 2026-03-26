import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { quoteResponseSchema } from '@/http/schemas/sales/quotes/quote.schema';
import { makeSendQuoteUseCase } from '@/use-cases/sales/quotes/factories/make-send-quote-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function sendQuoteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/quotes/:id/send',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.QUOTES.SEND,
        resource: 'quotes',
      }),
    ],
    schema: {
      tags: ['Sales - Quotes'],
      summary: 'Send a quote (DRAFT -> SENT)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          quote: quoteResponseSchema,
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
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeSendQuoteUseCase();
        const { quote } = await useCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.QUOTE_SEND,
          entityId: id,
          placeholders: { userName: userId, quoteTitle: quote.title },
          newData: { status: 'SENT', sentAt: quote.sentAt },
        });

        return reply.status(200).send({ quote });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
