import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListAnnouncementReceiptsUseCase } from '@/use-cases/hr/announcements/factories/make-list-announcement-receipts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListAnnouncementReceiptsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/announcements/:id/receipts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ANNOUNCEMENTS.MODIFY,
        resource: 'announcements',
      }),
    ],
    schema: {
      tags: ['HR - Announcements'],
      summary: 'List announcement read receipts',
      description:
        'Returns the list of audience employees that already read the announcement (with `readAt`) and the list of audience employees that have not read it yet.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          readers: z.array(
            z.object({
              employeeId: z.string(),
              fullName: z.string(),
              photoUrl: z.string().nullable(),
              readAt: z.date(),
            }),
          ),
          nonReaders: z.array(
            z.object({
              employeeId: z.string(),
              fullName: z.string(),
              photoUrl: z.string().nullable(),
            }),
          ),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: announcementId } = request.params;

      try {
        const listAnnouncementReceiptsUseCase =
          makeListAnnouncementReceiptsUseCase();
        const { readers, nonReaders } =
          await listAnnouncementReceiptsUseCase.execute({
            tenantId,
            announcementId,
          });

        return reply.status(200).send({
          readers: readers.map((entry) => ({
            employeeId: entry.employee.id.toString(),
            fullName: entry.employee.fullName,
            photoUrl: entry.employee.photoUrl ?? null,
            readAt: entry.readAt,
          })),
          nonReaders: nonReaders.map((employee) => ({
            employeeId: employee.id.toString(),
            fullName: employee.fullName,
            photoUrl: employee.photoUrl ?? null,
          })),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
