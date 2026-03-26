import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createRubricaSchema,
  esocialRubricaResponseSchema,
} from '@/http/schemas/esocial';
import { makeCreateRubricaUseCase } from '@/use-cases/esocial/rubricas/factories/make-create-rubrica';
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

export async function v1CreateRubricaController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/rubricas',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.RUBRICAS.REGISTER,
        resource: 'esocial-rubricas',
      }),
    ],
    schema: {
      tags: ['eSocial - Rubricas'],
      summary: 'Create rubrica',
      description: 'Create a new eSocial rubrica (payroll item definition).',
      body: createRubricaSchema,
      response: {
        201: z.object({
          rubrica: esocialRubricaResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateRubricaUseCase();
        const { rubrica } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply.status(201).send({
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
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
