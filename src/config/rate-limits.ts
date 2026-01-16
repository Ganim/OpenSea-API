/**
 * Rate Limiting Configuration
 *
 * Define diferentes limites de taxa para diferentes tipos de endpoints
 * para proteger a API contra abuso e ataques
 *
 * NOTA: Os limites são aplicados POR IP. Para aplicações internas,
 * considere aumentar os limites ou usar keyGenerator por userId.
 */

export const rateLimitConfig = {
  /**
   * Configuração global padrão
   * Aplicada a todos os endpoints que não têm configuração específica
   * Valor alto para não interferir com limites específicos
   */
  global: {
    max: 300, // 300 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Too many requests, please try again later.',
  },

  /**
   * Endpoints de autenticação
   * Limite restritivo - proteção contra brute force
   */
  auth: {
    max: 10, // 10 tentativas
    timeWindow: '1 minute', // por minuto
    message:
      'Too many authentication attempts, please try again in a few minutes.',
  },

  /**
   * Endpoints públicos
   * Limite moderado para endpoints sem autenticação
   */
  public: {
    max: 60, // 60 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Too many requests from this IP, please slow down.',
  },

  /**
   * Endpoints autenticados
   * Limite generoso para usuários logados
   */
  authenticated: {
    max: 200, // 200 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Rate limit exceeded, please slow down.',
  },

  /**
   * Endpoints de listagem/consulta
   * Limite adequado para SPAs que fazem múltiplas consultas ao carregar páginas
   */
  query: {
    max: 120, // 120 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Too many queries, please try again later.',
  },

  /**
   * Endpoints administrativos
   * Limite mais alto para administradores
   */
  admin: {
    max: 300, // 300 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Admin rate limit exceeded.',
  },

  /**
   * Endpoints de criação/modificação
   * Limite adequado para fluxos de cadastro sequencial
   */
  mutation: {
    max: 100, // 100 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Too many modifications, please slow down.',
  },

  /**
   * Endpoints de upload/processamento pesado
   * Limite mais restritivo para operações custosas
   */
  heavy: {
    max: 20, // 20 requisições
    timeWindow: '1 minute', // por minuto
    message: 'Too many heavy operations, please try again later.',
  },
} as const;

/**
 * Helper type para garantir type-safety
 */
export type RateLimitType = keyof typeof rateLimitConfig;

/**
 * Helper function para obter configuração de rate limit
 */
export function getRateLimitConfig(type: RateLimitType = 'global') {
  return rateLimitConfig[type];
}
