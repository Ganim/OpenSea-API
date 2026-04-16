import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { kudosReplyToDTO } from '@/mappers/hr/kudos-reply';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeUpdateKudosReplyUseCase } from '@/use-cases/hr/kudos/factories/make-update-kudos-reply-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateKudosReplyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
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
      summary: 'Edit a kudos reply',
      description: 'Updates the content of a reply. Only the author can edit.',
      params: z.object({ id: z.string() }),
      body: z.object({ content: z.string().min(1) }),
      response: {
        200: z.object({
          reply: z.object({
            id: z.string(),
            kudosId: z.string(),
            employeeId: z.string(),
            content: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const replyId = request.params.id;
      const { content } = request.body;

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
        const updateKudosReplyUseCase = makeUpdateKudosReplyUseCase();
        const { reply: updatedReply } = await updateKudosReplyUseCase.execute({
          tenantId,
          replyId,
          requesterEmployeeId: requesterEmployee.id.toString(),
          content,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.KUDOS_REPLY_UPDATE,
          entityId: updatedReply.kudosId.toString(),
          placeholders: { userName: userId },
          newData: { replyId },
        });

        return reply.status(200).send({ reply: kudosReplyToDTO(updatedReply) });
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
