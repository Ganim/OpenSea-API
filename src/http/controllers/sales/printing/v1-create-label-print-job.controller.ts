import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createLabelPrintJobBodySchema,
  createLabelPrintJobResponseSchema,
} from '@/http/schemas/sales/printing/print-job.schema';
import { prisma } from '@/lib/prisma';
import { emitJobToAgent } from '@/lib/websocket/socket-server';
import { makeCreateLabelPrintJobUseCase } from '@/use-cases/sales/printing/factories/make-create-label-print-job-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateLabelPrintJobController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/print-jobs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.PRINT,
        resource: 'sales-print-jobs',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Create a label print job',
      description: 'Queues a label PDF for printing on the specified printer.',
      body: createLabelPrintJobBodySchema,
      response: {
        201: createLabelPrintJobResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateLabelPrintJobUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          ...request.body,
        });

        // Emit job to the print agent via WebSocket
        const printer = await prisma.posPrinter.findFirst({
          where: { id: request.body.printerId },
        });

        if (printer?.agentId) {
          emitJobToAgent(printer.agentId, 'job:new', {
            jobId: result.jobId,
            type: 'LABEL',
            content: request.body.content,
            printerName: printer.osName ?? printer.name,
            copies: request.body.copies ?? 1,
          });
        }

        return reply.status(201).send(result);
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
