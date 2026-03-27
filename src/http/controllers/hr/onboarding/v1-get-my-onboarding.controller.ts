import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { onboardingChecklistToDTO } from '@/mappers/hr/onboarding-checklist';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeGetMyOnboardingUseCase } from '@/use-cases/hr/onboarding/factories/make-get-my-onboarding-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetMyOnboardingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/my/onboarding',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'Get my onboarding checklist',
      description:
        'Returns the onboarding checklist for the logged-in employee',
      response: {
        200: z.object({
          checklist: z.object({
            id: z.string(),
            employeeId: z.string(),
            items: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional(),
                completed: z.boolean(),
                completedAt: z.date().optional(),
              }),
            ),
            progress: z.number(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const employeesRepository = new PrismaEmployeesRepository();
      const employee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!employee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const getMyOnboardingUseCase = makeGetMyOnboardingUseCase();
        const { checklist } = await getMyOnboardingUseCase.execute({
          tenantId,
          employeeId: employee.id.toString(),
        });

        return reply.status(200).send({
          checklist: onboardingChecklistToDTO(checklist),
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
