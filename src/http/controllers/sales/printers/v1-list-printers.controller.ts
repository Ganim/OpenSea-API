import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listPrintersResponseSchema } from '@/http/schemas/sales/printing/printer.schema';
import { makeListPrintersUseCase } from '@/use-cases/sales/printing/factories/make-list-printers-use-case';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1ListPrintersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/printers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ACCESS,
        resource: 'sales-printers',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'List tenant printers',
      response: {
        200: listPrintersResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const useCase = makeListPrintersUseCase();
      const tenantId = request.user.tenantId!;
      const result = await useCase.execute({ tenantId });

      // Build agent name lookup
      const agentIds = [...new Set(result.printers.map((p) => p.agentId).filter(Boolean))] as string[];
      const agents = agentIds.length > 0
        ? await prisma.printAgent.findMany({
            where: { id: { in: agentIds }, tenantId },
            select: { id: true, name: true },
          })
        : [];
      const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));

      return reply.status(200).send({
        printers: result.printers.map((printer) => ({
          id: printer.id.toString(),
          name: printer.name,
          type: printer.type,
          connection: printer.connection,
          ipAddress: printer.ipAddress ?? null,
          port: printer.port ?? null,
          deviceId: printer.deviceId ?? null,
          bluetoothAddress: printer.bluetoothAddress ?? null,
          paperWidth: printer.paperWidth,
          isDefault: printer.isDefault,
          isActive: printer.isActive,
          isHidden: printer.isHidden,
          status: printer.status ?? 'UNKNOWN',
          lastSeenAt: printer.lastSeenAt?.toISOString() ?? null,
          agentId: printer.agentId ?? null,
          agentName: printer.agentId ? (agentNameMap.get(printer.agentId) ?? null) : null,
          osName: printer.osName ?? null,
        })),
      });
    },
  });
}
