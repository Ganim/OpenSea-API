import { verifyAccountant } from '@/http/middlewares/finance/verify-accountant';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import type { FastifyInstance, FastifyRequest } from 'fastify';

interface AccountantContext {
  id: string;
  tenantId: string;
  email: string;
  name: string;
}

export async function getAccountantCategoriesController(app: FastifyInstance) {
  app.route({
    method: 'GET',
    url: '/v1/accountant/categories',
    preHandler: [verifyAccountant],
    schema: {
      tags: ['Accountant Portal'],
      summary: 'Get read-only finance categories',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const accountant = (request as unknown as { accountant: AccountantContext })
        .accountant;

      const categoriesRepo = new PrismaFinanceCategoriesRepository();
      const categories = await categoriesRepo.findMany(accountant.tenantId);

      return reply.status(200).send({
        categories: categories.map((c) => ({
          id: c.id.toString(),
          name: c.name,
          type: c.type,
          parentId: c.parentId?.toString() ?? null,
        })),
      });
    },
  });
}
