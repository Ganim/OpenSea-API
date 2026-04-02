import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UserBlockedError } from '@/@errors/use-cases/user-blocked-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { logger } from '@/lib/logger';
import {
  clearLoginFailures,
  recordLoginFailure,
} from '@/http/plugins/login-bruteforce-guard.plugin';
import { authResponseSchema } from '@/http/schemas';
import { makeAuthenticateUnifiedUseCase } from '@/use-cases/core/auth/factories/make-authenticate-unified-use-case';
import { makeListUserTenantsUseCase } from '@/use-cases/core/tenants/factories/make-list-user-tenants-use-case';
import { makeSelectTenantUseCase } from '@/use-cases/core/tenants/factories/make-select-tenant-use-case';
import { makeCreatePersonalCalendarUseCase } from '@/use-cases/calendar/calendars/factories/make-create-personal-calendar-use-case';
import { makeEnsureSystemCalendarsUseCase } from '@/use-cases/calendar/calendars/factories/make-ensure-system-calendars-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const bodySchema = z.object({
  identifier: z.string().min(1, 'Identificador é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function authenticateUnifiedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/login/unified',
    schema: {
      tags: ['Auth'],
      summary:
        'Authenticate user with unified login (email, CPF, or enrollment)',
      body: bodySchema,
      response: {
        200: authResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.union([
          z.object({ message: z.string(), blockedUntil: z.coerce.date() }),
          z.object({
            message: z.string(),
            code: z.literal('PASSWORD_RESET_REQUIRED'),
            resetToken: z.string(),
            reason: z.string().nullable().optional(),
            requestedAt: z.coerce.date().nullable().optional(),
          }),
        ]),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { identifier, password } = request.body;

      const ip = request.ip;
      const userAgent = request.headers['user-agent'];

      try {
        const authenticateUseCase = makeAuthenticateUnifiedUseCase();

        const { user, sessionId, token, refreshToken } =
          await authenticateUseCase.execute({
            identifier,
            password,
            ip,
            userAgent,
            reply,
          });

        // Clear brute-force counter on successful login
        clearLoginFailures(ip).catch((err) => {
          logger.error({ err, ip }, 'Failed to clear login failure counter');
        });

        // Auditoria de login bem-sucedido
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.AUTH_LOGIN,
          entityId: sessionId,
          placeholders: {
            userName: user.profile?.name
              ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
              : user.username || user.email,
          },
          affectedUserId: user.id,
          newData: { identifier, sessionId },
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
        let finalToken = token;

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
          // Se falhar a listagem/seleção de tenants, login continua normalmente
          logger.warn(
            { err, userId: user.id },
            'Failed to auto-select tenant on login',
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
        // Record failed attempt for brute-force protection
        if (
          error instanceof BadRequestError ||
          error instanceof ResourceNotFoundError
        ) {
          recordLoginFailure(ip).catch((err) => {
            logger.error({ err, ip }, 'Failed to record login failure');
          });
        }

        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof PasswordResetRequiredError) {
          return reply.status(403).send({
            message: error.message,
            code: error.code,
            resetToken: error.data.resetToken,
            reason: error.data.reason ?? null,
            requestedAt: error.data.requestedAt ?? null,
          });
        }
        if (error instanceof UserBlockedError) {
          return reply.status(403).send({
            message: error.message,
            blockedUntil: error.blockedUntil,
          });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
