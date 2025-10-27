import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createVariantController } from './v1-create-variant.controller';
import { deleteVariantController } from './v1-delete-variant.controller';
import { getVariantByIdController } from './v1-get-variant-by-id.controller';
import { listVariantsController } from './v1-list-variants.controller';
import { updateVariantController } from './v1-update-variant.controller';

export async function variantsRoutes() {
  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createVariantController);
      managerApp.register(updateVariantController);
      managerApp.register(deleteVariantController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getVariantByIdController);
      queryApp.register(listVariantsController);
    },
    { prefix: '' },
  );
}
