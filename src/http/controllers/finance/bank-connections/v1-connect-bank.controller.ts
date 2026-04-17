import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeConnectBankUseCase } from '@/use-cases/finance/bank-connections/factories/make-connect-bank-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function connectBankController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/bank-connections',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ADMIN,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Connections'],
      summary: 'Save bank connection after Pluggy widget',
      security: [{ bearerAuth: [] }],
      body: z.object({
        bankAccountId: z.string().uuid(),
        externalItemId: z.string(),
      }),
      response: {
        201: z.object({
          connection: z.object({
            id: z.string(),
            bankAccountId: z.string(),
            provider: z.string(),
            status: z.string(),
            lastSyncAt: z.string().nullable(),
            createdAt: z.string(),
          }),
        }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { bankAccountId, externalItemId } = request.body;

      try {
        const useCase = makeConnectBankUseCase();
        const result = await useCase.execute({
          tenantId,
          bankAccountId,
          externalItemId,
        });

        return reply.status(201).send({
          connection: {
            id: result.connection.id,
            bankAccountId: result.connection.bankAccountId,
            provider: result.connection.provider,
            status: result.connection.status,
            lastSyncAt: result.connection.lastSyncAt?.toISOString() ?? null,
            createdAt: result.connection.createdAt.toISOString(),
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
