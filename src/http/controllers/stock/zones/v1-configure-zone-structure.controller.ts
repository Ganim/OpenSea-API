import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  configureZoneStructureSchema,
  configureStructureResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { zoneToDTO } from '@/mappers/stock/zone/zone-to-dto';
import { makeConfigureZoneStructureUseCase } from '@/use-cases/stock/zones/factories/make-configure-zone-structure-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function configureZoneStructureController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/zones/:id/structure',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.UPDATE,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Configure zone structure and generate bins',
      description:
        'Configura a estrutura fisica de uma zona (corredores, prateleiras, posicoes) e gera automaticamente os bins correspondentes.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: configureZoneStructureSchema,
      response: {
        200: configureStructureResponseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { structure, regenerateBins } = request.body;

      try {
        const configureZoneStructureUseCase =
          makeConfigureZoneStructureUseCase();
        const { zone, binsCreated, binsDeleted } =
          await configureZoneStructureUseCase.execute({
            zoneId: id,
            structure,
            regenerateBins,
          });

        return reply.status(200).send({
          zone: zoneToDTO(zone),
          binsCreated,
          binsDeleted,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
