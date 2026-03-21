import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListSkillDefinitionsUseCase } from '@/use-cases/admin/catalog/factories/make-list-skill-definitions';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentSkillDefinition, presentSkillPricing } from './presenters';

export async function v1ListSkillDefinitionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/catalog/skills',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Catalog'],
      summary: 'List all skill definitions (super admin)',
      description:
        'Lists all system skill definitions with their associated pricing. Optionally filter by module.',
      querystring: z.object({
        module: z.string().optional(),
      }),
      response: {
        200: z.object({
          skills: z.array(z.record(z.string(), z.unknown())),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { module } = request.query;

      const listSkillDefinitionsUseCase = makeListSkillDefinitionsUseCase();
      const { skills } = await listSkillDefinitionsUseCase.execute({ module });

      const formattedSkills = skills.map(({ skill, pricing }) => ({
        skill: presentSkillDefinition(skill),
        pricing: pricing ? presentSkillPricing(pricing) : null,
      }));

      return reply.status(200).send({ skills: formattedSkills });
    },
  });
}
