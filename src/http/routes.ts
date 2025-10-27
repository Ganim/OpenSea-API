import type { FastifyInstance } from 'fastify';

// Core routes
import { authRoutes } from './controllers/core/auth/routes';
import { meRoutes } from './controllers/core/me/routes';
import { sessionsRoutes } from './controllers/core/sessions/routes';
import { usersRoutes } from './controllers/core/users/routes';
import { healthRoutes } from './controllers/health/routes';

// Sales routes
import { commentsRoutes } from './controllers/sales/comments/routes';
import { customersRoutes } from './controllers/sales/customers/routes';
import { itemReservationsRoutes } from './controllers/sales/item-reservations/routes';
import { notificationPreferencesRoutes } from './controllers/sales/notification-preferences/routes';
import { salesOrdersRoutes } from './controllers/sales/sales-orders/routes';
import { variantPromotionsRoutes } from './controllers/sales/variant-promotions/routes';

// Stock routes
import { categoriesRoutes } from './controllers/stock/categories/routes';
import { itemMovementsRoutes } from './controllers/stock/item-movements/routes';
import { itemsRoutes } from './controllers/stock/items/routes';
import { locationsRoutes } from './controllers/stock/locations/routes';
import { manufacturersRoutes } from './controllers/stock/manufacturers/routes';
import { productsRoutes } from './controllers/stock/products/routes';
import { purchaseOrdersRoutes } from './controllers/stock/purchase-orders/routes';
import { suppliersRoutes } from './controllers/stock/suppliers/routes';
import { tagsRoutes } from './controllers/stock/tags/routes';
import { templatesRoutes } from './controllers/stock/templates/routes';
import { variantsRoutes } from './controllers/stock/variants/routes';

export async function registerRoutes(app: FastifyInstance) {
  // Core routes
  await app.register(healthRoutes);
  await app.register(meRoutes);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(sessionsRoutes);

  // Stock routes
  await app.register(productsRoutes);
  await app.register(variantsRoutes);
  await app.register(categoriesRoutes);
  await app.register(manufacturersRoutes);
  await app.register(suppliersRoutes);
  await app.register(locationsRoutes);
  await app.register(tagsRoutes);
  await app.register(templatesRoutes);
  await app.register(itemsRoutes);
  await app.register(itemMovementsRoutes);
  await app.register(purchaseOrdersRoutes);

  // Sales routes
  await app.register(customersRoutes);
  await app.register(salesOrdersRoutes);
  await app.register(commentsRoutes);
  await app.register(variantPromotionsRoutes);
  await app.register(itemReservationsRoutes);
  await app.register(notificationPreferencesRoutes);
}
