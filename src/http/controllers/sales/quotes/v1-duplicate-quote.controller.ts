import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { quoteResponseSchema } from '@/http/schemas/sales/quotes/quote.schema';
import { makeDuplicateQuoteUseCase } from '@/use-cases/sales/quotes/factories/make-duplicate-quote-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function duplicateQuoteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/quotes/:id/duplicate',
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
      summary: 'Duplicate a quote as a new DRAFT',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        201: z.object({
          quote: quoteResponseSchema,
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
        const useCase = makeDuplicateQuoteUseCase();
        const { quote } = await useCase.execute({
          tenantId,
          id,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.QUOTE_DUPLICATE,
          entityId: quote.id,
          placeholders: { userName: userId, quoteTitle: quote.title },
          newData: { originalQuoteId: id, newQuoteId: quote.id },
        });

        return reply.status(201).send({ quote });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
