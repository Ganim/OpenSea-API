import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { logger } from '@/lib/logger';
import { authResponseSchema } from '@/http/schemas';
import { makeVerifyMagicLinkUseCase } from '@/use-cases/core/auth/factories/make-verify-magic-link-use-case';
import { makeListUserTenantsUseCase } from '@/use-cases/core/tenants/factories/make-list-user-tenants-use-case';
import { makeSelectTenantUseCase } from '@/use-cases/core/tenants/factories/make-select-tenant-use-case';
import { makeCreatePersonalCalendarUseCase } from '@/use-cases/calendar/calendars/factories/make-create-personal-calendar-use-case';
import { makeEnsureSystemCalendarsUseCase } from '@/use-cases/calendar/calendars/factories/make-ensure-system-calendars-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const bodySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export async function verifyMagicLinkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/magic-link/verify',
    schema: {
      tags: ['Auth'],
      summary: 'Verify magic link token and authenticate user',
      body: bodySchema,
      response: {
        200: authResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.body;

      const ip = request.ip;
      const userAgent = request.headers['user-agent'];

      try {
        const verifyUseCase = makeVerifyMagicLinkUseCase();

        const {
          user,
          sessionId,
          token: authToken,
          refreshToken,
        } = await verifyUseCase.execute({
          token,
          ip,
          userAgent,
          reply,
        });

        // Auditoria de login via magic link
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.AUTH_LOGIN,
          entityId: sessionId,
          placeholders: {
            userName: user.profile?.name
              ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
              : user.username || user.email,
          },
          affectedUserId: user.id,
          newData: { method: 'magic-link', sessionId },
        });

        // Busca tenants do usuário para auto-seleção
        let tenants: Array<{
          id: string;
          name: string;
          slug: string;
          logoUrl: string | null;
          status: string;
          role: string;
          joinedAt: Date;
        }> = [];
        let autoSelectedTenant: (typeof tenants)[0] | null = null;
        let finalToken = authToken;

        try {
          const listTenantsUseCase = makeListUserTenantsUseCase();
          const { tenants: userTenants } = await listTenantsUseCase.execute({
            userId: user.id,
          });
          tenants = userTenants;

          // Auto-selecionar se exatamente 1 tenant (e não é super admin)
          if (userTenants.length === 1 && !user.isSuperAdmin) {
            const tenantId = userTenants[0].id;
            const selectTenantUseCase = makeSelectTenantUseCase();
            const selectResult = await selectTenantUseCase.execute({
              userId: user.id,
              tenantId,
              sessionId,
              isSuperAdmin: user.isSuperAdmin ?? false,
              reply,
            });
            finalToken = selectResult.token;
            autoSelectedTenant = userTenants[0];

            // Ensure calendars exist (fire-and-forget)
            Promise.all([
              makeCreatePersonalCalendarUseCase().execute({
                tenantId,
                userId: user.id,
              }),
              makeEnsureSystemCalendarsUseCase().execute({
                tenantId,
                userId: user.id,
              }),
            ]).catch((err) => {
              logger.warn(
                { err, tenantId, userId: user.id },
                'Failed to ensure calendars on auto-select tenant',
              );
            });
          }
        } catch (err) {
          logger.warn(
            { err, userId: user.id },
            'Failed to auto-select tenant on magic-link login',
          );
        }

        return reply.status(200).send({
          user,
          sessionId,
          token: finalToken,
          refreshToken,
          tenant: autoSelectedTenant,
          tenants,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
