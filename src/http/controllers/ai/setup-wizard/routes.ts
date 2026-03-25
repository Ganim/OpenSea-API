import type { FastifyInstance } from 'fastify';

import { runSetupWizardController } from './v1-run-setup-wizard.controller';

export async function aiSetupWizardRoutes(app: FastifyInstance) {
  app.register(runSetupWizardController);
}
