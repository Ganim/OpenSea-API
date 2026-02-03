import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  positionResponseSchema,
  updatePositionSchema,
} from '@/http/schemas/hr.schema';
import { positionToDTO } from '@/mappers/hr/position';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeGetPositionByIdUseCase,
  makeUpdatePositionUseCase,
} from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid position ID format'),
});

export async function updatePositionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/positions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.POSITIONS.UPDATE,
        resource: 'positions',
      }),
    ],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Update a position',
      description: 'Updates an existing position record',
      params: paramsSchema,
      body: updatePositionSchema,
      response: {
        200: z.object({
          position: positionResponseSchema,
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
      const { id } = request.params;
      const {
        name,
        code,
        description,
        departmentId,
        level,
        minSalary,
        maxSalary,
        isActive,
      } = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPositionByIdUseCase = makeGetPositionByIdUseCase();

        const [{ user }, { position: oldPosition }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getPositionByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updatePositionUseCase = makeUpdatePositionUseCase();
        const { position } = await updatePositionUseCase.execute({
          tenantId,
          id,
          name,
          code,
          description,
          departmentId,
          level,
          minSalary,
          maxSalary,
          isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.POSITION_UPDATE,
          entityId: id,
          placeholders: { userName, positionName: position.name },
          oldData: { name: oldPosition.name, code: oldPosition.code },
          newData: { name, code, departmentId, level },
        });

        return reply.status(200).send({ position: positionToDTO(position) });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Position not found' ||
            error.message === 'Department not found'
          ) {
            return reply.status(404).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
