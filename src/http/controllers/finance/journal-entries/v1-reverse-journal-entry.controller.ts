import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { journalEntryResponseSchema } from '@/http/schemas/finance';
import { makeReverseJournalEntryUseCase } from '@/use-cases/finance/journal-entries/factories/make-reverse-journal-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function reverseJournalEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/journal-entries/:id/reverse',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.JOURNAL_ENTRIES.MODIFY,
        resource: 'journal-entries',
      }),
    ],
    schema: {
      tags: ['Finance - Journal Entries'],
      summary: 'Reverse a journal entry (estorno)',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        201: z.object({ reversalEntry: journalEntryResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const createdBy = request.user.sub;
      const { id } = request.params as { id: string };

      try {
        const useCase = makeReverseJournalEntryUseCase();
        const result = await useCase.execute({
          tenantId,
          journalEntryId: id,
          createdBy,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
