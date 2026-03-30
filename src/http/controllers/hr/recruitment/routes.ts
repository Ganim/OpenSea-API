import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { v1CreateJobPostingController } from './v1-create-job-posting.controller';
import { v1ListJobPostingsController } from './v1-list-job-postings.controller';
import { v1GetJobPostingController } from './v1-get-job-posting.controller';
import { v1UpdateJobPostingController } from './v1-update-job-posting.controller';
import { v1DeleteJobPostingController } from './v1-delete-job-posting.controller';
import { v1PublishJobPostingController } from './v1-publish-job-posting.controller';
import { v1CloseJobPostingController } from './v1-close-job-posting.controller';
import { v1CreateCandidateController } from './v1-create-candidate.controller';
import { v1ListCandidatesController } from './v1-list-candidates.controller';
import { v1GetCandidateController } from './v1-get-candidate.controller';
import { v1CreateApplicationController } from './v1-create-application.controller';
import { v1ListApplicationsController } from './v1-list-applications.controller';
import { v1HireApplicationController } from './v1-hire-application.controller';
import { v1RejectApplicationController } from './v1-reject-application.controller';
import { v1CreateInterviewStageController } from './v1-create-interview-stage.controller';
import { v1ListInterviewStagesController } from './v1-list-interview-stages.controller';
import { v1ScheduleInterviewController } from './v1-schedule-interview.controller';
import { v1ListInterviewsController } from './v1-list-interviews.controller';
import { v1CompleteInterviewController } from './v1-complete-interview.controller';
import { v1CancelInterviewController } from './v1-cancel-interview.controller';

export async function recruitmentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      // Job Postings
      mutationApp.register(v1CreateJobPostingController);
      mutationApp.register(v1UpdateJobPostingController);
      mutationApp.register(v1DeleteJobPostingController);
      mutationApp.register(v1PublishJobPostingController);
      mutationApp.register(v1CloseJobPostingController);
      // Candidates
      mutationApp.register(v1CreateCandidateController);
      // Applications
      mutationApp.register(v1CreateApplicationController);
      mutationApp.register(v1HireApplicationController);
      mutationApp.register(v1RejectApplicationController);
      // Interview Stages
      mutationApp.register(v1CreateInterviewStageController);
      // Interviews
      mutationApp.register(v1ScheduleInterviewController);
      mutationApp.register(v1CompleteInterviewController);
      mutationApp.register(v1CancelInterviewController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      // Job Postings
      queryApp.register(v1ListJobPostingsController);
      queryApp.register(v1GetJobPostingController);
      // Candidates
      queryApp.register(v1ListCandidatesController);
      queryApp.register(v1GetCandidateController);
      // Applications
      queryApp.register(v1ListApplicationsController);
      // Interview Stages
      queryApp.register(v1ListInterviewStagesController);
      // Interviews
      queryApp.register(v1ListInterviewsController);
    },
    { prefix: '' },
  );
}
