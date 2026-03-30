import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateGeofenceZoneController } from './v1-create-geofence-zone.controller';
import { v1ListGeofenceZonesController } from './v1-list-geofence-zones.controller';
import { v1UpdateGeofenceZoneController } from './v1-update-geofence-zone.controller';
import { v1DeleteGeofenceZoneController } from './v1-delete-geofence-zone.controller';
import { v1ValidateGeofenceController } from './v1-validate-geofence.controller';

export async function geofenceZonesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListGeofenceZonesController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateGeofenceZoneController);
      mutationApp.register(v1UpdateGeofenceZoneController);
      mutationApp.register(v1DeleteGeofenceZoneController);
      mutationApp.register(v1ValidateGeofenceController);
    },
    { prefix: '' },
  );
}
