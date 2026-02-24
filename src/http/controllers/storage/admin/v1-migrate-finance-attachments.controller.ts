import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeMigrateFinanceAttachmentsUseCase } from '@/use-cases/storage/migration/factories/make-migrate-finance-attachments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function migrateFinanceAttachmentsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/storage/migrate-finance-attachments',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Storage'],
      summary:
        'Migrate FinanceAttachment records to StorageFile (one-time migration)',
      description:
        'Reads all FinanceAttachment records for the given tenant and creates corresponding StorageFile and StorageFileVersion records. This operation is idempotent: already-migrated files are skipped. Requires super admin privileges.',
      body: z.object({
        tenantId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          migratedCount: z.number().int(),
          skippedCount: z.number().int(),
          totalAttachments: z.number().int(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.body;

      const migrateFinanceAttachmentsUseCase =
        makeMigrateFinanceAttachmentsUseCase();

      const { migratedCount, skippedCount, totalAttachments } =
        await migrateFinanceAttachmentsUseCase.execute({ tenantId });

      return reply.status(200).send({
        migratedCount,
        skippedCount,
        totalAttachments,
      });
    },
  });
}
