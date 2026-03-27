import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetEscalationTimelineUseCase } from '@/use-cases/finance/escalations/factories/make-get-escalation-timeline-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const timelineStepSchema = z.object({
  stepNumber: z.number(),
  type: z.string(),
  status: z.enum(['COMPLETED', 'FAILED', 'PENDING', 'SCHEDULED']),
  scheduledDate: z.string().optional(),
  executedDate: z.string().optional(),
  channel: z.string(),
  description: z.string(),
  messagePreview: z.string().optional(),
});

export async function getEscalationTimelineController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/escalations/timeline',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'Get escalation timeline for a finance entry',
      description:
        'Returns a visual timeline of executed and planned escalation steps for an overdue entry.',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        entryId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          entryId: z.string(),
          currentStep: z.number(),
          totalSteps: z.number(),
          steps: z.array(timelineStepSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { entryId } = request.query;

      const useCase = makeGetEscalationTimelineUseCase();
      const result = await useCase.execute({
        entryId,
        tenantId,
      });

      return reply.status(200).send(result);
    },
  });
}
