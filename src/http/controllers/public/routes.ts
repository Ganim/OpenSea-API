import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { rateLimitConfig } from '@/config/rate-limits';

import { getPaymentLinkPublicController } from './v1-get-payment-link-public.controller';
import { renderLandingPageController } from './v1-render-landing-page.controller';
import { getPublicChatbotConfigController } from './v1-get-chatbot-config-public.controller';
import { handleChatbotMessageController } from './v1-handle-chatbot-message.controller';
import { customerPortalPublicRoutes } from './customer-portal/routes';
import { v1GetPublicAdmissionController } from './v1-get-public-admission.controller';
import { v1SubmitCandidateDataController } from './v1-submit-candidate-data.controller';
import { v1SignAdmissionDocumentController } from './v1-sign-admission-document.controller';
import { v1PunchVerifyPublicController } from './v1-punch-verify-public.controller';

export async function publicRoutes(app: FastifyInstance) {
  // No auth middleware — these endpoints are public
  app.register(getPaymentLinkPublicController);
  app.register(renderLandingPageController);
  app.register(getPublicChatbotConfigController);
  app.register(handleChatbotMessageController);
  app.register(customerPortalPublicRoutes);

  // Admission Digital — public endpoints
  app.register(v1GetPublicAdmissionController);
  app.register(v1SubmitCandidateDataController);
  app.register(v1SignAdmissionDocumentController);
}

/**
 * Rotas públicas de punch — separadas em função própria para ter rate-limit
 * isolado (30 req/min via `signaturePublicVerify`) sem aplicar esse limite
 * a todas as demais rotas públicas (Phase 06 / Plan 06-03).
 *
 * Registrada separadamente em `src/http/routes.ts` (próximo a
 * `signaturePublicRoutes`).
 */
export async function publicPunchRoutes(app: FastifyInstance) {
  await app.register(
    async (publicApp) => {
      await publicApp.register(
        rateLimit,
        rateLimitConfig.signaturePublicVerify,
      );
      await publicApp.register(v1PunchVerifyPublicController);
    },
    { prefix: '/v1/public/punch' },
  );
}
