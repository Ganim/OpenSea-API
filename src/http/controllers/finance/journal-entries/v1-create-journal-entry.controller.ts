import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createJournalEntrySchema,
  journalEntryResponseSchema,
} from '@/http/schemas/finance';
import { makeCreateJournalEntryUseCase } from '@/use-cases/finance/journal-entries/factories/make-create-journal-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createJournalEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/journal-entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.JOURNAL_ENTRIES.REGISTER,
        resource: 'journal-entries',
      }),
    ],
    schema: {
      tags: ['Finance - Journal Entries'],
      summary: 'Create a manual journal entry',
      security: [{ bearerAuth: [] }],
      body: createJournalEntrySchema,
      response: {
        201: z.object({ journalEntry: journalEntryResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const createdBy = request.user.sub;

      try {
        const useCase = makeCreateJournalEntryUseCase();
        const result = await useCase.execute({
          tenantId,
          createdBy,
          ...request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
