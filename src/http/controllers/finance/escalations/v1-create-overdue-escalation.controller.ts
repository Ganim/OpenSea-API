import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateOverdueEscalationUseCase } from '@/use-cases/finance/escalations/factories/make-create-overdue-escalation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const escalationStepSchema = z.object({
  daysOverdue: z.number().int().min(1),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'INTERNAL_NOTE', 'SYSTEM_ALERT']),
  templateType: z.enum([
    'FRIENDLY_REMINDER',
    'FORMAL_NOTICE',
    'URGENT_NOTICE',
    'FINAL_NOTICE',
  ]),
  subject: z.string().max(256).optional(),
  message: z.string().min(1),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0),
});

export async function createOverdueEscalationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/escalations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'Create an overdue escalation template with steps',
      security: [{ bearerAuth: [] }],
      body: z.object({
        name: z.string().min(1).max(128),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        steps: z.array(escalationStepSchema).min(1),
      }),
      response: {
        201: z.object({
          escalation: z.any(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { name, isDefault, isActive, steps } = request.body;

      const useCase = makeCreateOverdueEscalationUseCase();
      const result = await useCase.execute({
        tenantId,
        name,
        isDefault,
        isActive,
        steps,
      });

      return reply.status(201).send(result);
    },
  });
}
