import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createPositionSchema,
  positionResponseSchema,
} from '@/http/schemas/hr.schema';
import { positionToDTO } from '@/mappers/hr/position';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreatePositionUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createPositionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/positions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.POSITIONS.CREATE,
        resource: 'positions',
      }),
    ],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Create a new position',
      description: 'Creates a new position record in the system',
      body: createPositionSchema,
      response: {
        201: z.object({
          position: positionResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
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
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createPositionUseCase = makeCreatePositionUseCase();
        const { position } = await createPositionUseCase.execute({
          name,
          code,
          description,
          departmentId: departmentId ?? undefined,
          level,
          minSalary,
          maxSalary,
          isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.POSITION_CREATE,
          entityId: position.id.toString(),
          placeholders: { userName, positionName: position.name },
          newData: { name, code, departmentId, level },
        });

        return reply.status(201).send({ position: positionToDTO(position) });
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
