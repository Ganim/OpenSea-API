export const circuitBreakerConfig = {
  /**
   * Configuração para operações de banco de dados
   */
  database: {
    /** Timeout em ms para cada operação */
    timeout: 5000,
    /** Percentual de erros para abrir o circuit (0-100) */
    errorThresholdPercentage: 50,
    /** Tempo em ms antes de tentar novamente (half-open) */
    resetTimeout: 30000,
    /** Mínimo de requests antes de calcular o percentual */
    volumeThreshold: 10,
  },

  /**
   * Configuração para chamadas externas (APIs, webhooks, etc)
   */
  external: {
    timeout: 10000,
    errorThresholdPercentage: 60,
    resetTimeout: 60000,
    volumeThreshold: 5,
  },

  /**
   * Configuração para operações de cache (Redis)
   */
  cache: {
    timeout: 2000,
    errorThresholdPercentage: 70,
    resetTimeout: 15000,
    volumeThreshold: 20,
  },
} as const;

export type CircuitBreakerType = keyof typeof circuitBreakerConfig;
