/**
 * Fastify request augmentation for the Punch v2.0 subsystem.
 *
 * Populated by `verifyPunchDeviceToken` middleware (Plan 04-04) when a
 * caller authenticates via the `x-punch-device-token` header. Kept in its
 * own module-declaration file so that the POS augmentation
 * (`fastify-pos.d.ts`) remains independent and to avoid cross-module
 * coupling between the two device-token ecosystems.
 */
declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Present only after `verifyPunchDeviceToken` succeeded. Carries the
     * identity of the paired PunchDevice that authenticated the request.
     *
     * When present, the downstream handler MUST scope every repository
     * query by `punchDevice.tenantId` — never trust `request.body.tenantId`
     * or any other caller-controlled field for isolation.
     */
    punchDevice?: {
      id: string;
      tenantId: string;
      deviceKind: string;
      geofenceZoneId?: string | null;
    };
  }
}

export {};
