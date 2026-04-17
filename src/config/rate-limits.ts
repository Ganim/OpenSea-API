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

  /**
   * Public share link endpoints
   * Rate limit by share token to prevent brute-force of password-protected links
   */
  shareLink: {
    max: 10, // 10 tentativas por token
    timeWindow: '1 minute', // por minuto
    message: 'Too many attempts for this share link, please try again later.',
  },

  /**
   * Email sending endpoints
   * Limite restritivo para prevenir email bombing e abuso de cota SMTP.
   * Envio de email é a operação mais custosa (conexão SMTP + reputação do domínio).
   */
  emailSend: {
    max: 30, // 30 emails por minuto
    timeWindow: '1 minute',
    message:
      'Limite de envio de emails atingido. Aguarde antes de enviar mais.',
  },

  /**
   * Email connection test endpoints
   * Limite restritivo para prevenir brute-force de credenciais SMTP/IMAP.
   */
  emailTest: {
    max: 10, // 10 tentativas por minuto
    timeWindow: '1 minute',
    message:
      'Muitas tentativas de teste de conexão. Aguarde antes de testar novamente.',
  },

  /**
   * Password-protected item verification
   * Limite restritivo por itemId+IP para prevenir brute-force de senhas de arquivos/pastas.
   */
  protectionVerify: {
    max: 5, // 5 tentativas por minuto por item
    timeWindow: '1 minute',
    message:
      'Muitas tentativas de verificação de senha. Aguarde antes de tentar novamente.',
  },

  /**
   * Finance mutation endpoints (create, update, delete entries, payments, etc.)
   * Limite adequado para operações financeiras que alteram dados.
   */
  financeMutation: {
    max: 100, // 100 requisições por minuto
    timeWindow: '1 minute',
    message:
      'Limite de operações financeiras atingido. Aguarde antes de continuar.',
  },

  /**
   * Finance bulk operations (bulk-pay, bulk-cancel, bulk-delete, bulk-categorize, batch create)
   * Limite restritivo para operações em lote que impactam muitos registros de uma vez.
   */
  financeBulk: {
    max: 20, // 20 requisições por minuto
    timeWindow: '1 minute',
    message:
      'Limite de operações em lote atingido. Aguarde antes de continuar.',
  },

  /**
   * Finance webhook/integration endpoints (PIX callbacks, boleto webhooks, bank sync)
   * Limite moderado para integrações externas que recebem notificações.
   */
  financeWebhook: {
    max: 30, // 30 requisições por minuto
    timeWindow: '1 minute',
    message:
      'Limite de webhooks financeiros atingido. Aguarde antes de continuar.',
  },

  /**
   * Payment gateway webhook endpoints (InfinitePay, Asaas, etc.)
   * Limite moderado para notificações de pagamento externas.
   */
  paymentWebhook: {
    max: 30, // 30 requisições por minuto
    timeWindow: '1 minute',
    message:
      'Limite de webhooks de pagamento atingido. Aguarde antes de continuar.',
  },

  /**
   * Customer portal token endpoints (validate, list invoices, get invoice, generate payment)
   * Limite restritivo por token+IP para prevenir brute-force de tokens.
   */
  customerPortal: {
    max: 10, // 10 tentativas por minuto por token+IP
    timeWindow: '1 minute',
    message:
      'Muitas tentativas no portal. Aguarde antes de tentar novamente.',
  },

  /**
   * Signature OTP endpoints (request + verify)
   * Limite restritivo por IP para prevenir abuso/brute-force de OTP de 6 dígitos.
   */
  signatureOtp: {
    max: 5, // 5 tentativas por 10 minutos
    timeWindow: '10 minutes',
    message:
      'Muitas tentativas de OTP. Aguarde 10 minutos antes de tentar novamente.',
  },

  /**
   * Public signature verification endpoint (verify-by-code)
   * Limite moderado para consulta pública da autenticidade do documento.
   */
  signaturePublicVerify: {
    max: 30, // 30 requisições por minuto
    timeWindow: '1 minute',
    message:
      'Muitas consultas de verificação. Aguarde antes de tentar novamente.',
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
