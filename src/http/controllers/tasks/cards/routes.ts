import type { FastifyInstance } from 'fastify';

import { archiveCardController } from './v1-archive-card.controller';
import { assignCardController } from './v1-assign-card.controller';
import { createCardController } from './v1-create-card.controller';
import { deleteCardController } from './v1-delete-card.controller';
import { getCardController } from './v1-get-card.controller';
import { listCardsController } from './v1-list-cards.controller';
import { manageCardLabelsController } from './v1-manage-card-labels.controller';
import { moveCardController } from './v1-move-card.controller';
import { updateCardController } from './v1-update-card.controller';

export async function taskCardsRoutes(app: FastifyInstance) {
  app.register(createCardController);
  app.register(updateCardController);
  app.register(deleteCardController);
  app.register(getCardController);
  app.register(listCardsController);
  app.register(moveCardController);
  app.register(assignCardController);
  app.register(archiveCardController);
  app.register(manageCardLabelsController);
}
