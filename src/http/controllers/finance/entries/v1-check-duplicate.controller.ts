import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDetectDuplicateEntryUseCase } from '@/use-cases/finance/entries/factories/make-detect-duplicate-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const checkDuplicateBodySchema = z.object({
  supplierName: z.string().optional(),
  customerName: z.string().optional(),
  expectedAmount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  description: z.string().optional(),
});

const duplicateMatchSchema = z.object({
  entryId: z.string(),
  description: z.string(),
  supplierName: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  expectedAmount: z.number(),
  dueDate: z.string(),
  score: z.number(),
  matchReasons: z.array(z.string()),
});

const checkDuplicateResponseSchema = z.object({
  duplicates: z.array(duplicateMatchSchema),
});

export async function checkDuplicateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/check-duplicate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Check for potential duplicate entries before creation',
      description:
        'Scores existing entries against the provided data to detect possible duplicates. Returns entries with a similarity score >= 70.',
      security: [{ bearerAuth: [] }],
      body: checkDuplicateBodySchema,
      response: {
        200: checkDuplicateResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        supplierName,
        customerName,
        expectedAmount,
        dueDate,
        description,
      } = request.body;

      const useCase = makeDetectDuplicateEntryUseCase();
      const result = await useCase.execute({
        tenantId,
        supplierName,
        customerName,
        expectedAmount,
        dueDate,
        description,
      });

      return reply.status(200).send(result);
    },
  });
}
