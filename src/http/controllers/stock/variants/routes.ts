import { app } from '@/app';
import { createVariantController } from './v1-create-variant.controller';
import { deleteVariantController } from './v1-delete-variant.controller';
import { getVariantByIdController } from './v1-get-variant-by-id.controller';
import { listVariantsController } from './v1-list-variants.controller';
import { updateVariantController } from './v1-update-variant.controller';

export async function variantsRoutes() {
  // Manager routes
  app.register(createVariantController);
  app.register(updateVariantController);
  app.register(deleteVariantController);

  // Authenticated routes
  app.register(getVariantByIdController);
  app.register(listVariantsController);
}
