import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createLandingPageController } from './v1-create-landing-page.controller';
import { deleteLandingPageController } from './v1-delete-landing-page.controller';
import { getLandingPageByIdController } from './v1-get-landing-page-by-id.controller';
import { listLandingPagesController } from './v1-list-landing-pages.controller';
import { publishLandingPageController } from './v1-publish-landing-page.controller';
import { unpublishLandingPageController } from './v1-unpublish-landing-page.controller';
import { updateLandingPageController } from './v1-update-landing-page.controller';

export async function landingPagesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listLandingPagesController);
  await app.register(getLandingPageByIdController);
  await app.register(createLandingPageController);
  await app.register(updateLandingPageController);
  await app.register(deleteLandingPageController);
  await app.register(publishLandingPageController);
  await app.register(unpublishLandingPageController);
}
