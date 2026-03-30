import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateSurveyController } from './v1-create-survey.controller';
import { v1ListSurveysController } from './v1-list-surveys.controller';
import { v1GetSurveyController } from './v1-get-survey.controller';
import { v1UpdateSurveyController } from './v1-update-survey.controller';
import { v1DeleteSurveyController } from './v1-delete-survey.controller';
import { v1ActivateSurveyController } from './v1-activate-survey.controller';
import { v1CloseSurveyController } from './v1-close-survey.controller';
import { v1CreateSurveyQuestionController } from './v1-create-survey-question.controller';
import { v1SubmitSurveyResponseController } from './v1-submit-survey-response.controller';

export async function surveysRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateSurveyController);
      mutationApp.register(v1UpdateSurveyController);
      mutationApp.register(v1DeleteSurveyController);
      mutationApp.register(v1ActivateSurveyController);
      mutationApp.register(v1CloseSurveyController);
      mutationApp.register(v1CreateSurveyQuestionController);
      mutationApp.register(v1SubmitSurveyResponseController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListSurveysController);
      queryApp.register(v1GetSurveyController);
    },
    { prefix: '' },
  );
}
