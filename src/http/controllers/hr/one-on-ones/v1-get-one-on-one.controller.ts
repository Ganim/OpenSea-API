import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { checkInlinePermission } from '@/http/helpers/check-inline-permission';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  oneOnOneMeetingDetailResponseSchema,
  oneOnOneMeetingIdParamsSchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneActionItemToDTO } from '@/mappers/hr/one-on-one-action-item';
import { oneOnOneMeetingToDTO } from '@/mappers/hr/one-on-one-meeting';
import { oneOnOneTalkingPointToDTO } from '@/mappers/hr/one-on-one-talking-point';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeGetOneOnOneUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetOneOnOneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/one-on-ones/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.ACCESS,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Detalha uma reunião 1:1',
      description:
        'Retorna a reunião com seus talking points e action items. Notas privadas são filtradas pela função do usuário (manager ou report).',
      params: oneOnOneMeetingIdParamsSchema,
      response: {
        200: oneOnOneMeetingDetailResponseSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        let viewerEmployeeId: string | undefined;
        try {
          const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
          const { employee } = await getMyEmployeeUseCase.execute({
            tenantId,
            userId,
          });
          viewerEmployeeId = employee.id.toString();
        } catch {
          viewerEmployeeId = undefined;
        }

        let canAdmin = false;
        try {
          await checkInlinePermission(
            request,
            PermissionCodes.HR.ONE_ON_ONES.ADMIN,
          );
          canAdmin = true;
        } catch {
          canAdmin = false;
        }

        const getOneOnOneUseCase = makeGetOneOnOneUseCase();
        const result = await getOneOnOneUseCase.execute({
          tenantId,
          meetingId: id,
          viewerEmployeeId,
          canSeeAllPrivateNotes: canAdmin,
        });

        return reply.status(200).send({
          meeting: oneOnOneMeetingToDTO(result.meeting, {
            viewerIsManager: result.viewerIsManager,
            viewerIsReport: result.viewerIsReport,
          }),
          talkingPoints: result.talkingPoints.map((point) =>
            oneOnOneTalkingPointToDTO(point),
          ),
          actionItems: result.actionItems.map((item) =>
            oneOnOneActionItemToDTO(item),
          ),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
