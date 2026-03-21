import type { FastifyInstance } from 'fastify';

import { listFavoritesController } from './v1-list-favorites.controller';
import { createFavoriteController } from './v1-create-favorite.controller';
import { deleteFavoriteController } from './v1-delete-favorite.controller';

export async function aiFavoritesRoutes(app: FastifyInstance) {
  app.register(listFavoritesController);
  app.register(createFavoriteController);
  app.register(deleteFavoriteController);
}
