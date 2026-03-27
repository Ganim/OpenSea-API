import type { FastifyInstance } from 'fastify';
import { getPaymentLinkPublicController } from './v1-get-payment-link-public.controller';
import { renderLandingPageController } from './v1-render-landing-page.controller';
import { getPublicChatbotConfigController } from './v1-get-chatbot-config-public.controller';
import { handleChatbotMessageController } from './v1-handle-chatbot-message.controller';
import { customerPortalPublicRoutes } from './customer-portal/routes';
import { v1GetPublicAdmissionController } from './v1-get-public-admission.controller';
import { v1SubmitCandidateDataController } from './v1-submit-candidate-data.controller';
import { v1SignAdmissionDocumentController } from './v1-sign-admission-document.controller';

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
