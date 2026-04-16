import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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
import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PrismaKudosRepliesRepository } from '@/repositories/hr/prisma/prisma-kudos-replies-repository';
import { makeReplyToKudosUseCase } from '@/use-cases/hr/kudos/factories/make-reply-to-kudos-use-case';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ReplyToKudosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/kudos/:id/replies',
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
      summary: 'Reply to a kudos',
      description: 'Creates a thread reply on a kudos.',
      params: z.object({ id: z.string() }),
      body: z.object({ content: z.string().min(1) }),
      response: {
        201: z.object({
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
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const kudosId = request.params.id;
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
        const replyToKudosUseCase = makeReplyToKudosUseCase();
        const { reply: createdReply } = await replyToKudosUseCase.execute({
          tenantId,
          kudosId,
          employeeId: requesterEmployee.id.toString(),
          content,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.KUDOS_REPLY_CREATE,
          entityId: kudosId,
          placeholders: { userName: userId },
          newData: { replyId: createdReply.id.toString() },
        });

        await notifyKudosThreadParticipants({
          tenantId,
          kudosId,
          actorEmployeeId: requesterEmployee.id.toString(),
          replyId: createdReply.id.toString(),
        });

        return reply.status(201).send({ reply: kudosReplyToDTO(createdReply) });
      } catch (error) {
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

interface NotifyKudosThreadParticipantsInput {
  tenantId: string;
  kudosId: string;
  actorEmployeeId: string;
  replyId: string;
}

async function notifyKudosThreadParticipants(
  input: NotifyKudosThreadParticipantsInput,
): Promise<void> {
  const kudosRepository = new PrismaEmployeeKudosRepository();
  const repliesRepository = new PrismaKudosRepliesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  const kudos = await kudosRepository.findById(
    new UniqueEntityID(input.kudosId),
    input.tenantId,
  );
  if (!kudos) return;

  const previousReplies = await repliesRepository.findManyByKudosId(
    new UniqueEntityID(input.kudosId),
  );

  const recipients = new Set<string>();
  recipients.add(kudos.fromEmployeeId.toString());
  recipients.add(kudos.toEmployeeId.toString());
  for (const previousReply of previousReplies) {
    recipients.add(previousReply.employeeId.toString());
  }
  recipients.delete(input.actorEmployeeId);

  for (const recipientEmployeeId of recipients) {
    const recipientEmployee = await employeesRepository.findById(
      new UniqueEntityID(recipientEmployeeId),
      input.tenantId,
    );

    if (!recipientEmployee?.userId) continue;

    await createNotificationUseCase.execute({
      userId: recipientEmployee.userId.toString(),
      title: 'Nova resposta em um kudos',
      message: 'Alguém respondeu a um kudos do qual você participa.',
      type: 'INFO',
      priority: 'NORMAL',
      channel: 'IN_APP',
      entityType: 'EMPLOYEE_KUDOS_REPLY',
      entityId: input.replyId,
      actionUrl: `/hr/kudos/${input.kudosId}`,
      actionText: 'Abrir kudos',
    });
  }
}
