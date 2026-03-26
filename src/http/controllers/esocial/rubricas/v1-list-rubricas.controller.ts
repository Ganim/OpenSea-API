import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  esocialRubricaResponseSchema,
  listRubricasQuerySchema,
} from '@/http/schemas/esocial';
import { makeListRubricasUseCase } from '@/use-cases/esocial/rubricas/factories/make-list-rubricas';
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

export async function v1ListRubricasController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/rubricas',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.RUBRICAS.ACCESS,
        resource: 'esocial-rubricas',
      }),
    ],
    schema: {
      tags: ['eSocial - Rubricas'],
      summary: 'List rubricas',
      description: 'List eSocial rubricas with pagination and filters.',
      querystring: listRubricasQuerySchema,
      response: {
        200: z.object({
          data: z.array(esocialRubricaResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, search, type, isActive } = request.query;

      const useCase = makeListRubricasUseCase();
      const { rubricas, total } = await useCase.execute({
        tenantId,
        page,
        perPage,
        search,
        type,
        isActive,
      });

      const pages = Math.ceil(total / perPage);

      return reply.status(200).send({
        data: rubricas.map((r) => ({
          id: r.id.toString(),
          tenantId: r.tenantId.toString(),
          code: r.code,
          description: r.description,
          type: r.type,
          typeLabel: rubricaTypeLabel(r.type),
          incidInss: r.incidInss ?? null,
          incidIrrf: r.incidIrrf ?? null,
          incidFgts: r.incidFgts ?? null,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        meta: {
          total,
          page,
          limit: perPage,
          pages,
        },
      });
    },
  });
}
