import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  oneOnOneMeetingIdParamsSchema,
  oneOnOneMeetingResponseSchema,
  updateOneOnOneMeetingBodySchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneMeetingToDTO } from '@/mappers/hr/one-on-one-meeting';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeUpdateOneOnOneUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateOneOnOneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/one-on-ones/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.MODIFY,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Atualiza uma reunião 1:1',
      description:
        'Permite participantes alterarem agenda, status, notas compartilhadas e suas próprias notas privadas.',
      params: oneOnOneMeetingIdParamsSchema,
      body: updateOneOnOneMeetingBodySchema,
      response: {
        200: z.object({ meeting: oneOnOneMeetingResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const data = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: viewer } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const updateOneOnOneUseCase = makeUpdateOneOnOneUseCase();
        const { meeting } = await updateOneOnOneUseCase.execute({
          tenantId,
          meetingId: id,
          viewerEmployeeId: viewer.id.toString(),
          scheduledAt: data.scheduledAt,
          durationMinutes: data.durationMinutes,
          status: data.status,
          sharedNotes: data.sharedNotes ?? undefined,
          privateNotes: data.privateNotes ?? undefined,
          cancelledReason: data.cancelledReason ?? undefined,
        });

        const counterpartName = meeting.isManager(viewer.id)
          ? meeting.reportId.toString()
          : meeting.managerId.toString();

        const auditMessage =
          data.status === 'CANCELLED'
            ? AUDIT_MESSAGES.HR.ONE_ON_ONE_CANCEL
            : data.status === 'COMPLETED'
              ? AUDIT_MESSAGES.HR.ONE_ON_ONE_COMPLETE
              : AUDIT_MESSAGES.HR.ONE_ON_ONE_UPDATE;

        await logAudit(request, {
          message: auditMessage,
          entityId: meeting.id.toString(),
          placeholders: { userName: userId, counterpartName },
          newData: data as Record<string, unknown>,
        });

        return reply.status(200).send({
          meeting: oneOnOneMeetingToDTO(meeting, {
            viewerIsManager: meeting.isManager(viewer.id),
            viewerIsReport: meeting.isReport(viewer.id),
          }),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
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
