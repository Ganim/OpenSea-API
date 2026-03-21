import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetSkillTreeUseCase } from '@/use-cases/admin/catalog/factories/make-get-skill-tree';
import type { SkillTreeNode } from '@/use-cases/admin/catalog/get-skill-tree';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentSkillDefinition, presentSkillPricing } from './presenters';

function presentTreeNode(node: SkillTreeNode): Record<string, unknown> {
  return {
    skill: presentSkillDefinition(node.skill),
    pricing: node.pricing ? presentSkillPricing(node.pricing) : null,
    children: node.children.map(presentTreeNode),
  };
}

export async function v1GetSkillTreeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/catalog/skills/tree',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Catalog'],
      summary: 'Get skill definitions tree (super admin)',
      description:
        'Returns skill definitions organized as a hierarchical tree with pricing and children.',
      querystring: z.object({
        module: z.string().optional(),
      }),
      response: {
        200: z.object({
          tree: z.array(z.record(z.string(), z.unknown())),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { module } = request.query;

      const getSkillTreeUseCase = makeGetSkillTreeUseCase();
      const { tree } = await getSkillTreeUseCase.execute({ module });

      const formattedTree = tree.map(presentTreeNode);

      return reply.status(200).send({ tree: formattedTree });
    },
  });
}
