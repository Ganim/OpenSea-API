import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bonusResponseSchema,
  updateBonusSchema,
  idSchema,
} from '@/http/schemas';
import { bonusToDTO } from '@/mappers/hr/bonus';
import { makeUpdateBonusUseCase } from '@/use-cases/hr/bonuses/factories/make-update-bonus-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateBonusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/bonuses/:bonusId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BONUSES.MODIFY,
        resource: 'bonuses',
      }),
    ],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'Update a bonus',
      description:
        'Updates an existing bonus (only unpaid bonuses can be updated)',
      params: z.object({
        bonusId: idSchema,
      }),
      body: updateBonusSchema,
      response: {
        200: z.object({
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
      const { bonusId } = request.params;
      const data = request.body;

      try {
        const updateBonusUseCase = makeUpdateBonusUseCase();
        const { bonus } = await updateBonusUseCase.execute({
          tenantId,
          bonusId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BONUS_UPDATE,
          entityId: bonus.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: bonus.employeeId.toString(),
            description: bonus.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(200).send({ bonus: bonusToDTO(bonus) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
