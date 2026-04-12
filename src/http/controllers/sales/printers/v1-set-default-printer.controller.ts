import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1SetDefaultPrinterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/printers/:id/default',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ADMIN,
        resource: 'sales-printers',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Set a printer as the default for the tenant',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          id: z.string(),
          isDefault: z.boolean(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      const repo = new PrismaPosPrintersRepository();
      const printer = await repo.findById(new UniqueEntityID(id), tenantId);

      if (!printer) {
        throw new ResourceNotFoundError('Printer not found.');
      }

      await repo.unsetDefaultForTenant(tenantId);

      printer.isDefault = true;
      await repo.save(printer);

      return reply.status(200).send({
        id: printer.id.toString(),
        isDefault: printer.isDefault,
      });
    },
  });
}
