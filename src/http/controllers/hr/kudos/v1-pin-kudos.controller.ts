import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeKudosToDTO } from '@/mappers/hr/employee-kudos';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makePinKudosUseCase } from '@/use-cases/hr/kudos/factories/make-pin-kudos-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1PinKudosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/kudos/:id/pin',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.KUDOS.MODIFY,
        resource: 'kudos',
      }),
    ],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'Pin a kudos to the top of the feed',
      description:
        'Marks the kudos as pinned, recording the timestamp and the requesting employee.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          kudos: z.object({
            id: z.string(),
            fromEmployeeId: z.string(),
            toEmployeeId: z.string(),
            message: z.string(),
            category: z.string(),
            isPublic: z.boolean(),
            isPinned: z.boolean(),
            pinnedAt: z.date().nullable(),
            pinnedBy: z.string().nullable(),
            createdAt: z.date(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const kudosId = request.params.id;

      const employeesRepository = new PrismaEmployeesRepository();
      const requesterEmployee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!requesterEmployee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const pinKudosUseCase = makePinKudosUseCase();
        const { kudos: pinnedKudos } = await pinKudosUseCase.execute({
          tenantId,
          kudosId,
          requesterEmployeeId: requesterEmployee.id.toString(),
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.KUDOS_PIN,
          entityId: kudosId,
          placeholders: { userName: userId },
          newData: { isPinned: true },
        });

        return reply.status(200).send({ kudos: employeeKudosToDTO(pinnedKudos) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
