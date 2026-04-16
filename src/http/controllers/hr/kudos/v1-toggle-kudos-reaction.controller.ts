import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { makeToggleKudosReactionUseCase } from '@/use-cases/hr/kudos/factories/make-toggle-kudos-reaction-use-case';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ToggleKudosReactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/kudos/:id/reactions',
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
      summary: 'Toggle a reaction on a kudos',
      description:
        'Adds the given emoji as a reaction from the requesting employee, or removes it if it already exists. Returns the resulting action.',
      params: z.object({ id: z.string() }),
      body: z.object({ emoji: z.string().min(1).max(16) }),
      response: {
        200: z.object({
          action: z.enum(['added', 'removed']),
          reaction: z
            .object({
              id: z.string(),
              kudosId: z.string(),
              employeeId: z.string(),
              emoji: z.string(),
              createdAt: z.date(),
            })
            .nullable(),
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
      const { emoji } = request.body;

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
        const toggleKudosReactionUseCase = makeToggleKudosReactionUseCase();
        const { action, reaction } = await toggleKudosReactionUseCase.execute({
          tenantId,
          kudosId,
          employeeId: requesterEmployee.id.toString(),
          emoji,
        });

        await logAudit(request, {
          message:
            action === 'added'
              ? AUDIT_MESSAGES.HR.KUDOS_REACT
              : AUDIT_MESSAGES.HR.KUDOS_UNREACT,
          entityId: kudosId,
          placeholders: {
            userName: userId,
            emoji,
          },
          newData: { action, emoji },
        });

        if (action === 'added') {
          await notifyKudosParticipants({
            tenantId,
            kudosId,
            actorEmployeeId: requesterEmployee.id.toString(),
            emoji,
          });
        }

        return reply.status(200).send({
          action,
          reaction: reaction
            ? {
                id: reaction.id.toString(),
                kudosId: reaction.kudosId.toString(),
                employeeId: reaction.employeeId.toString(),
                emoji: reaction.emoji,
                createdAt: reaction.createdAt,
              }
            : null,
        });
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

interface NotifyKudosParticipantsInput {
  tenantId: string;
  kudosId: string;
  actorEmployeeId: string;
  emoji: string;
}

async function notifyKudosParticipants(
  input: NotifyKudosParticipantsInput,
): Promise<void> {
  const kudosRepository = new PrismaEmployeeKudosRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  const kudos = await kudosRepository.findById(
    new UniqueEntityID(input.kudosId),
    input.tenantId,
  );
  if (!kudos) return;

  const recipients = new Set<string>();
  recipients.add(kudos.fromEmployeeId.toString());
  recipients.add(kudos.toEmployeeId.toString());
  recipients.delete(input.actorEmployeeId);

  for (const recipientEmployeeId of recipients) {
    const recipientEmployee = await employeesRepository.findById(
      new UniqueEntityID(recipientEmployeeId),
      input.tenantId,
    );

    if (!recipientEmployee?.userId) continue;

    await createNotificationUseCase.execute({
      userId: recipientEmployee.userId.toString(),
      title: 'Nova reação no seu kudos',
      message: `Alguém reagiu com ${input.emoji} no kudos.`,
      type: 'INFO',
      priority: 'NORMAL',
      channel: 'IN_APP',
      entityType: 'EMPLOYEE_KUDOS_REACTION',
      entityId: `${input.kudosId}:${input.actorEmployeeId}:${input.emoji}`,
      actionUrl: `/hr/kudos/${input.kudosId}`,
      actionText: 'Abrir kudos',
    });
  }
}
