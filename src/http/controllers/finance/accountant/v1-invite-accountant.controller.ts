import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeInviteAccountantUseCase } from '@/use-cases/finance/accountant/factories/make-invite-accountant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function inviteAccountantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/accountant/invite',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ACCOUNTANT.REGISTER,
        resource: 'accountant',
      }),
    ],
    schema: {
      tags: ['Finance - Accountant Portal'],
      summary: 'Invite an accountant to the read-only portal',
      security: [{ bearerAuth: [] }],
      body: z.object({
        email: z.string().email(),
        name: z.string().min(2).max(128),
        cpfCnpj: z.string().max(18).optional(),
        crc: z.string().max(20).optional(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body as {
        email: string;
        name: string;
        cpfCnpj?: string;
        crc?: string;
        expiresInDays?: number;
      };

      const useCase = makeInviteAccountantUseCase();
      const result = await useCase.execute({
        tenantId,
        ...body,
      });

      return reply.status(201).send(result);
    },
  });
}
