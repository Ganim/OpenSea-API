import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  esocialRubricaResponseSchema,
  updateRubricaSchema,
} from '@/http/schemas/esocial';
import { idSchema } from '@/http/schemas/common.schema';
import { makeUpdateRubricaUseCase } from '@/use-cases/esocial/rubricas/factories/make-update-rubrica';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

function rubricaTypeLabel(type: number): string {
  switch (type) {
    case 1:
      return 'Vencimento';
    case 2:
      return 'Desconto';
    case 3:
      return 'Informativo';
    default:
      return 'Desconhecido';
  }
}

export async function v1UpdateRubricaController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/esocial/rubricas/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.RUBRICAS.MODIFY,
        resource: 'esocial-rubricas',
      }),
    ],
    schema: {
      tags: ['eSocial - Rubricas'],
      summary: 'Update rubrica',
      description: 'Update an existing eSocial rubrica.',
      params: z.object({ id: idSchema }),
      body: updateRubricaSchema,
      response: {
        200: z.object({
          rubrica: esocialRubricaResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateRubricaUseCase();
        const { rubrica } = await useCase.execute({
          tenantId,
          rubricaId: id,
          ...data,
        });

        return reply.status(200).send({
          rubrica: {
            id: rubrica.id.toString(),
            tenantId: rubrica.tenantId.toString(),
            code: rubrica.code,
            description: rubrica.description,
            type: rubrica.type,
            typeLabel: rubricaTypeLabel(rubrica.type),
            incidInss: rubrica.incidInss ?? null,
            incidIrrf: rubrica.incidIrrf ?? null,
            incidFgts: rubrica.incidFgts ?? null,
            isActive: rubrica.isActive,
            createdAt: rubrica.createdAt,
            updatedAt: rubrica.updatedAt,
          },
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
