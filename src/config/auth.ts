/**
 * Configurações de Segurança de Autenticação
 *
 * Estas configurações controlam aspectos críticos de segurança.
 * Em produção, valores mais restritivos são utilizados automaticamente.
 */

const isProduction = process.env.NODE_ENV === 'production';

// ============= ACCOUNT LOCKOUT =============

/** Número máximo de tentativas de login antes do bloqueio */
export const MAX_ATTEMPTS = 5;

/** Tempo de bloqueio em minutos após exceder tentativas */
export const BLOCK_MINUTES = 15;

// ============= PASSWORD RESET =============

/** Tempo de expiração do token de reset de senha em minutos */
export const PASSWORD_TOKEN_EXPIRATION_TIME = 30;

// ============= PASSWORD HASHING =============

/**
 * Número de rounds do bcrypt para hashing de senha.
 * - Produção: 12 rounds (~300ms por hash) - mais seguro
 * - Desenvolvimento: 6 rounds (~10ms por hash) - mais rápido
 *
 * Cada round adicional dobra o tempo de processamento.
 * Recomendação OWASP: 10-12 rounds para produção.
 */
export const HASH_ROUNDS = isProduction ? 12 : 6;

// ============= PASSWORD STRENGTH =============

/**
 * Requisitos de força de senha.
 * - Produção: requisitos mais rigorosos
 * - Desenvolvimento: requisitos mais permissivos para facilitar testes
 */
export const PASSWORD_PATTERN = isProduction
  ? {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false, // Opcional para não frustrar usuários
    }
  : {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumber: false,
      requireSpecial: false,
    };

// ============= PASSWORD VALIDATION MESSAGES =============

/**
 * Mensagens de validação de senha traduzidas
 */
export const PASSWORD_VALIDATION_MESSAGES = {
  minLength: (min: number) => `A senha deve ter pelo menos ${min} caracteres.`,
  requireUppercase: 'A senha deve conter pelo menos uma letra maiúscula.',
  requireLowercase: 'A senha deve conter pelo menos uma letra minúscula.',
  requireNumber: 'A senha deve conter pelo menos um número.',
  requireSpecial: 'A senha deve conter pelo menos um caractere especial.',
  notStrong: 'A senha não atende aos requisitos de segurança.',
};
