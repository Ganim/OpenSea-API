import type { FastifyReply } from 'fastify';

/**
 * Marks an HTTP response as coming from a deprecated endpoint.
 *
 * Follows RFC 8594 (Sunset) and draft-ietf-httpapi-deprecation-header.
 * - `Deprecation` header: indicates the endpoint is deprecated
 * - `Sunset` header: when the endpoint will be removed (HTTP-date)
 * - `Link` header: points clients to the replacement endpoint
 */
export function markDeprecated(
  reply: FastifyReply,
  params: { sunsetDate: Date; replacement: string; notes?: string },
): FastifyReply {
  reply.header('Deprecation', 'true');
  reply.header('Sunset', params.sunsetDate.toUTCString());
  reply.header(
    'Link',
    `<${params.replacement}>; rel="successor-version"${
      params.notes ? `; title="${params.notes}"` : ''
    }`,
  );
  return reply;
}

/**
 * Default sunset date for v1 notification preferences endpoints.
 * Chosen as 90 days after S1 completion to give consumers time to migrate.
 */
export const NOTIFICATION_PREFS_V1_SUNSET = new Date('2026-07-17T00:00:00Z');
