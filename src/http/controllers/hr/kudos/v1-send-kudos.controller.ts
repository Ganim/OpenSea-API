import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { employeeKudosToDTO } from '@/mappers/hr/employee-kudos';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeSendKudosUseCase } from '@/use-cases/hr/kudos/factories/make-send-kudos-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1SendKudosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/kudos',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'Send kudos to a colleague',
      description:
        'Sends a recognition (kudos) to another employee in the same tenant',
      body: z.object({
        // Employees use `@default(cuid())` — never `uuid()`. Validating with
        // .uuid() made this endpoint reject every legitimate recipient and
        // effectively broke kudos creation end-to-end.
        toEmployeeId: cuidSchema,
        message: z.string().min(1),
        category: z.enum([
          'TEAMWORK',
          'INNOVATION',
          'LEADERSHIP',
          'EXCELLENCE',
          'HELPFULNESS',
        ]),
        isPublic: z.boolean().default(true),
      }),
      response: {
        201: z.object({
          kudos: z.object({
            id: z.string(),
            fromEmployeeId: z.string(),
            toEmployeeId: z.string(),
            message: z.string(),
            category: z.string(),
            isPublic: z.boolean(),
            createdAt: z.date(),
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

      const employeesRepository = new PrismaEmployeesRepository();
      const senderEmployee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!senderEmployee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const sendKudosUseCase = makeSendKudosUseCase();
        const { kudos } = await sendKudosUseCase.execute({
          tenantId,
          fromEmployeeId: senderEmployee.id.toString(),
          toEmployeeId: request.body.toEmployeeId,
          message: request.body.message,
          category: request.body.category,
          isPublic: request.body.isPublic,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.KUDOS_SEND,
          entityId: kudos.id.toString(),
          placeholders: {
            userName: userId,
            category: request.body.category,
            recipientName: request.body.toEmployeeId,
          },
          newData: {
            toEmployeeId: request.body.toEmployeeId,
            category: request.body.category,
            isPublic: request.body.isPublic,
          },
        });

        return reply.status(201).send({
          kudos: employeeKudosToDTO(kudos),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
