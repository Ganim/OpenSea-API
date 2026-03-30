import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateAdmissionInviteController } from './v1-create-admission-invite.controller';
import { v1ListAdmissionInvitesController } from './v1-list-admission-invites.controller';
import { v1GetAdmissionInviteController } from './v1-get-admission-invite.controller';
import { v1UpdateAdmissionInviteController } from './v1-update-admission-invite.controller';
import { v1CancelAdmissionInviteController } from './v1-cancel-admission-invite.controller';
import { v1ApproveAdmissionController } from './v1-approve-admission.controller';
import { v1RejectAdmissionController } from './v1-reject-admission.controller';

export async function admissionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes with rate limit
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateAdmissionInviteController);
      mutationApp.register(v1UpdateAdmissionInviteController);
      mutationApp.register(v1CancelAdmissionInviteController);
      mutationApp.register(v1ApproveAdmissionController);
      mutationApp.register(v1RejectAdmissionController);
    },
    { prefix: '' },
  );

  // Query routes with rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListAdmissionInvitesController);
      queryApp.register(v1GetAdmissionInviteController);
    },
    { prefix: '' },
  );
}
