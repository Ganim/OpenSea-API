import CircuitBreaker from 'opossum';
import {
  circuitBreakerConfig,
  CircuitBreakerType,
} from '@/config/circuit-breaker';

// Store para manter referência dos circuit breakers criados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const circuitBreakers = new Map<string, CircuitBreaker<any[], any>>();

export interface CircuitBreakerOptions {
  /** Nome identificador do circuit breaker */
  name: string;
  /** Tipo de configuração a usar */
  type: CircuitBreakerType;
  /** Callback quando o circuit abre */
  onOpen?: () => void;
  /** Callback quando o circuit fecha */
  onClose?: () => void;
  /** Callback quando o circuit entra em half-open */
  onHalfOpen?: () => void;
  /** Callback para cada falha */
  onFailure?: (error: Error) => void;
}

/**
 * Cria um circuit breaker para uma função assíncrona
 */
export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: CircuitBreakerOptions,
): CircuitBreaker<TArgs, TResult> {
  const config = circuitBreakerConfig[options.type];

  const breaker = new CircuitBreaker(fn, {
    timeout: config.timeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
    volumeThreshold: config.volumeThreshold,
    name: options.name,
  });

  // Event handlers
  breaker.on('open', () => {
    console.error(
      `[CircuitBreaker] ${options.name} OPENED - requests will fail fast`,
    );
    options.onOpen?.();
  });

  breaker.on('close', () => {
    console.log(
      `[CircuitBreaker] ${options.name} CLOSED - back to normal operation`,
    );
    options.onClose?.();
  });

  breaker.on('halfOpen', () => {
    console.log(
      `[CircuitBreaker] ${options.name} HALF-OPEN - testing if service recovered`,
    );
    options.onHalfOpen?.();
  });

  breaker.on('failure', (error: Error) => {
    console.warn(`[CircuitBreaker] ${options.name} failure:`, error.message);
    options.onFailure?.(error);
  });

  breaker.on('timeout', () => {
    console.warn(
      `[CircuitBreaker] ${options.name} timeout after ${config.timeout}ms`,
    );
  });

  breaker.on('reject', () => {
    console.warn(`[CircuitBreaker] ${options.name} rejected - circuit is open`);
  });

  // Armazena referência
  circuitBreakers.set(options.name, breaker);

  return breaker;
}

/**
 * Obtém um circuit breaker existente pelo nome
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCircuitBreaker(
  name: string,
): CircuitBreaker<any[], any> | undefined {
  return circuitBreakers.get(name);
}

/**
 * Obtém estatísticas de todos os circuit breakers
 */
export function getAllCircuitBreakerStats(): Record<
  string,
  CircuitBreakerStats
> {
  const stats: Record<string, CircuitBreakerStats> = {};

  for (const [name, breaker] of circuitBreakers) {
    stats[name] = getCircuitBreakerStats(breaker);
  }

  return stats;
}

export interface CircuitBreakerStats {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  stats: {
    successes: number;
    failures: number;
    rejects: number;
    timeouts: number;
    fallbacks: number;
  };
}

/**
 * Obtém estatísticas de um circuit breaker específico
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCircuitBreakerStats(
  breaker: CircuitBreaker<any[], any>,
): CircuitBreakerStats {
  const stats = breaker.stats;

  let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  if (breaker.opened) {
    state = 'OPEN';
  } else if (breaker.halfOpen) {
    state = 'HALF_OPEN';
  }

  return {
    name: breaker.name || 'unknown',
    state,
    stats: {
      successes: stats.successes,
      failures: stats.failures,
      rejects: stats.rejects,
      timeouts: stats.timeouts,
      fallbacks: stats.fallbacks,
    },
  };
}

/**
 * Reseta todos os circuit breakers (útil para testes)
 */
export function resetAllCircuitBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.close();
  }
}

/**
 * Wrapper para executar uma função com circuit breaker
 * Cria o circuit breaker se não existir
 */
export async function withCircuitBreaker<TResult>(
  name: string,
  type: CircuitBreakerType,
  fn: () => Promise<TResult>,
): Promise<TResult> {
  let breaker = circuitBreakers.get(name) as
    | CircuitBreaker<[], TResult>
    | undefined;

  if (!breaker) {
    breaker = createCircuitBreaker(fn, { name, type });
  }

  return breaker.fire();
}
