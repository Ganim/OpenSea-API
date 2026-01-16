import { randomUUID } from 'crypto';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

/**
 * Plugin que adiciona um ID único a cada request
 * - Se o cliente enviar X-Request-Id, usa esse valor
 * - Caso contrário, gera um UUID v4
 * - O ID é retornado no header X-Request-Id da resposta
 */
const requestIdPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    // Usa o ID enviado pelo cliente ou gera um novo
    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();

    // Adiciona ao request para uso em logs e contexto
    request.requestId = requestId;

    // Retorna no header da resposta
    reply.header('x-request-id', requestId);
  });
};

export default fp(requestIdPlugin, {
  name: 'request-id',
  fastify: '5.x',
});

/**
 * Helper para obter o request ID do contexto atual
 */
export function getRequestId(request: FastifyRequest): string {
  return request.requestId || 'unknown';
}
