import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  manufacturerResponseSchema,
  updateManufacturerSchema,
} from '@/http/schemas/stock/manufacturers';
import { manufacturerToDTO } from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetManufacturerByIdUseCase } from '@/use-cases/stock/manufacturers/factories/make-get-manufacturer-by-id-use-case';
import { makeUpdateManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-update-manufacturer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/manufacturers/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.MANUFACTURERS.UPDATE,
        resource: 'manufacturers',
      }),
    ],
    schema: {
      tags: ['Stock - Manufacturers'],
      summary: 'Update an existing manufacturer',
      description:
        'Update an existing manufacturer with the provided information',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateManufacturerSchema,
      response: {
        200: z.object({
          manufacturer: manufacturerResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getManufacturerByIdUseCase = makeGetManufacturerByIdUseCase();

        const [{ user }, { manufacturer: oldManufacturer }] = await Promise.all(
          [
            getUserByIdUseCase.execute({ userId }),
            getManufacturerByIdUseCase.execute({ id }),
          ],
        );
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateManufacturerUseCase();
        const result = await useCase.execute({
          id,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.MANUFACTURER_UPDATE,
          entityId: result.manufacturer.id.toString(),
          placeholders: {
            userName,
            manufacturerName: result.manufacturer.name,
          },
          oldData: { name: oldManufacturer.name },
          newData: body,
        });

        return reply.send({
          manufacturer: manufacturerToDTO(result.manufacturer),
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
