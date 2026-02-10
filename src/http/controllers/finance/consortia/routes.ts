import type { FastifyInstance } from 'fastify';

import { createConsortiumController } from './v1-create-consortium.controller';
import { updateConsortiumController } from './v1-update-consortium.controller';
import { deleteConsortiumController } from './v1-delete-consortium.controller';
import { getConsortiumByIdController } from './v1-get-consortium-by-id.controller';
import { listConsortiaController } from './v1-list-consortia.controller';
import { registerConsortiumPaymentController } from './v1-register-consortium-payment.controller';
import { markContemplatedController } from './v1-mark-contemplated.controller';

export async function consortiaRoutes(app: FastifyInstance) {
  app.register(getConsortiumByIdController);
  app.register(listConsortiaController);
  app.register(createConsortiumController);
  app.register(updateConsortiumController);
  app.register(deleteConsortiumController);
  app.register(registerConsortiumPaymentController);
  app.register(markContemplatedController);
}
