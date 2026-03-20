import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bonusResponseSchema, createBonusSchema } from '@/http/schemas';
import { bonusToDTO } from '@/mappers/hr/bonus';
import { makeCreateBonusUseCase } from '@/use-cases/hr/bonuses/factories/make-create-bonus-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateBonusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/bonuses',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PAYROLL.REGISTER,
        resource: 'bonuses',
      }),
    ],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'Create bonus',
      description: 'Creates a new bonus for an employee',
      body: createBonusSchema,
      response: {
        201: z.object({
          bonus: bonusResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const createBonusUseCase = makeCreateBonusUseCase();
        const { bonus } = await createBonusUseCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BONUS_CREATE,
          entityId: bonus.id.toString(),
          placeholders: {
            userName: request.user.sub,
            amount: String(bonus.amount),
            employeeName: bonus.employeeId.toString(),
            description: bonus.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({ bonus: bonusToDTO(bonus) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
