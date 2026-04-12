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

export async function v1TogglePrinterHiddenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/printers/:id/hidden',
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
      summary: 'Toggle printer visibility (hidden/visible)',
      params: z.object({ id: z.string() }),
      body: z.object({ isHidden: z.boolean() }),
      response: {
        200: z.object({
          id: z.string(),
          isHidden: z.boolean(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { isHidden } = request.body;
      const tenantId = request.user.tenantId!;

      const repo = new PrismaPosPrintersRepository();
      const printer = await repo.findById(new UniqueEntityID(id), tenantId);

      if (!printer) {
        throw new ResourceNotFoundError('Printer not found.');
      }

      printer.isHidden = isHidden;
      await repo.save(printer);

      return reply.status(200).send({
        id: printer.id.toString(),
        isHidden: printer.isHidden,
      });
    },
  });
}
