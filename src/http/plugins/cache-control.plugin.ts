import { createHash } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Plugin que adiciona Cache-Control e ETag a respostas GET 200.
 *
 * Regras:
 * - Endpoints públicos (planos, módulos): Cache-Control: public, max-age=300 (5min)
 * - Endpoints de leitura autenticados: Cache-Control: private, max-age=60 (1min)
 * - Mutações (POST/PUT/PATCH/DELETE): sem cache
 * - ETag baseado em MD5 do payload para suporte a 304 Not Modified
 */
const cacheControlPlugin: FastifyPluginAsync = async (app) => {
  const PUBLIC_PATTERNS = [
    /^\/v1\/admin\/plans$/,
    /^\/v1\/admin\/plans\/[^/]+$/,
  ];

  app.addHook('onSend', (request, reply, payload, done) => {
    // Apenas GET com status 200
    if (request.method !== 'GET' || reply.statusCode !== 200) {
      return done(null, payload);
    }

    // Não cachear health checks ou docs
    if (
      request.url === '/health' ||
      request.url.startsWith('/docs') ||
      request.url.startsWith('/swagger')
    ) {
      return done(null, payload);
    }

    // Determinar se é endpoint público
    const isPublic = PUBLIC_PATTERNS.some((pattern) =>
      pattern.test(request.url),
    );
    const maxAge = isPublic ? 300 : 60;
    const scope = isPublic ? 'public' : 'private';

    // Use no-cache + ETag for authenticated endpoints so the browser always
    // revalidates with If-None-Match. This ensures React Query invalidation
    // fetches fresh data while still benefiting from 304 when data hasn't changed.
    // Public endpoints keep max-age for full caching.
    if (isPublic) {
      reply.header('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      reply.header('Cache-Control', 'private, no-cache');
    }

    // ETag apenas para payloads string (JSON responses)
    if (typeof payload === 'string' && payload.length > 0) {
      const etag = `"${createHash('md5').update(payload).digest('hex')}"`;
      reply.header('ETag', etag);

      // Suporte a 304 Not Modified
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        reply.code(304);
        return done(null, '');
      }
    }

    return done(null, payload);
  });
};

export default fp(cacheControlPlugin, {
  name: 'cache-control',
  fastify: '5.x',
});
