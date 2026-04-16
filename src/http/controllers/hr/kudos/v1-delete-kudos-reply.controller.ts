import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeDeleteKudosReplyUseCase } from '@/use-cases/hr/kudos/factories/make-delete-kudos-reply-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteKudosReplyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/kudos/replies/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.KUDOS.ACCESS,
        resource: 'kudos',
      }),
    ],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'Delete a kudos reply',
      description:
        'Soft-deletes a reply. Allowed for the author or holders of the hr.kudos.admin permission.',
      params: z.object({ id: z.string() }),
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const replyId = request.params.id;

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

      const requesterIsKudosAdmin =
        request.user.permissions?.includes(PermissionCodes.HR.KUDOS.ADMIN) ??
        false;

      try {
        const deleteKudosReplyUseCase = makeDeleteKudosReplyUseCase();
        await deleteKudosReplyUseCase.execute({
          tenantId,
          replyId,
          requesterEmployeeId: requesterEmployee.id.toString(),
          requesterIsKudosAdmin,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.KUDOS_REPLY_DELETE,
          entityId: replyId,
          placeholders: { userName: userId },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
