import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { activateCadenceSequenceController } from './v1-activate-cadence-sequence.controller';
import { advanceStepController } from './v1-advance-step.controller';
import { createCadenceSequenceController } from './v1-create-cadence-sequence.controller';
import { deactivateCadenceSequenceController } from './v1-deactivate-cadence-sequence.controller';
import { deleteCadenceSequenceController } from './v1-delete-cadence-sequence.controller';
import { enrollContactController } from './v1-enroll-contact.controller';
import { getCadenceSequenceByIdController } from './v1-get-cadence-sequence-by-id.controller';
import { listCadenceSequencesController } from './v1-list-cadence-sequences.controller';
import { processPendingActionsController } from './v1-process-pending-actions.controller';
import { updateCadenceSequenceController } from './v1-update-cadence-sequence.controller';

export async function cadencesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listCadenceSequencesController);
  await app.register(getCadenceSequenceByIdController);
  await app.register(createCadenceSequenceController);
  await app.register(updateCadenceSequenceController);
  await app.register(deleteCadenceSequenceController);
  await app.register(activateCadenceSequenceController);
  await app.register(deactivateCadenceSequenceController);
  await app.register(enrollContactController);
  await app.register(advanceStepController);
  await app.register(processPendingActionsController);
}
