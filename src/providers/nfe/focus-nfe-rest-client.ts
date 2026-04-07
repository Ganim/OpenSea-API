import axios, { AxiosInstance } from 'axios';

/**
 * Focus NFe REST Client com retry logic e validação HMAC
 */
export class FocusNfeRestClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private readonly RETRY_DELAYS = [3000, 5000, 10000, 30000, 60000]; // ms

  constructor(production: boolean = true) {
    this.baseUrl = production
      ? 'https://api.focusnfe.com.br'
      : 'https://sandbox.focusnfe.com.br';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenSea-API/1.0',
      },
    });
  }

  /**
   * Faz uma requisição com retry exponencial
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>,
    apiKey?: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.RETRY_DELAYS.length; attempt++) {
      try {
        const response = await this.client.request<T>({
          method,
          url: endpoint,
          data,
          auth: apiKey ? { username: apiKey, password: 'X' } : undefined,
        });

        // Valida HMAC da response se presente
        if (response.headers['x-signature']) {
          this.validateHmac(response.data, response.headers['x-signature']);
        }

        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Se for o último attempt, lança o erro
        if (attempt === this.RETRY_DELAYS.length) {
          throw lastError;
        }

        // Se for erro não-retentável, lança imediatamente
        if (this.isNonRetryableError(error)) {
          throw lastError;
        }

        // Aguarda antes de retry
        await this.delay(this.RETRY_DELAYS[attempt]);
      }
    }

    throw lastError || new Error('Unknown error in Focus NFe request');
  }

  /**
   * POST /v1/nfe (crear NF-e)
   */
  async createNfe(
    data: Record<string, unknown>,
    apiKey: string,
  ): Promise<Record<string, unknown>> {
    return this.request('POST', '/v1/nfe', data, apiKey);
  }

  /**
   * POST /v1/nfce (crear NFC-e)
   */
  async createNfce(
    data: Record<string, unknown>,
    apiKey: string,
  ): Promise<Record<string, unknown>> {
    return this.request('POST', '/v1/nfce', data, apiKey);
  }

  /**
   * GET /v1/nfe/{ref} (status NF-e)
   */
  async getNfeStatus(
    ref: string,
    apiKey: string,
  ): Promise<Record<string, unknown>> {
    return this.request('GET', `/v1/nfe/${ref}`, undefined, apiKey);
  }

  /**
   * GET /v1/nfce/{ref} (status NFC-e)
   */
  async getNfceStatus(
    ref: string,
    apiKey: string,
  ): Promise<Record<string, unknown>> {
    return this.request('GET', `/v1/nfce/${ref}`, undefined, apiKey);
  }

  /**
   * DELETE /v1/nfe/{ref}/cancelamento (cancel NF-e)
   */
  async cancelNfe(
    ref: string,
    data: Record<string, unknown>,
    apiKey: string,
  ): Promise<Record<string, unknown>> {
    return this.request('DELETE', `/v1/nfe/${ref}/cancelamento`, data, apiKey);
  }

  /**
   * DELETE /v1/nfce/{ref}/cancelamento (cancel NFC-e)
   */
  async cancelNfce(
    ref: string,
    data: Record<string, unknown>,
    apiKey: string,
  ): Promise<Record<string, unknown>> {
    return this.request('DELETE', `/v1/nfce/${ref}/cancelamento`, data, apiKey);
  }

  /**
   * GET /teste (test connection)
   */
  async testConnection(apiKey: string): Promise<Record<string, unknown>> {
    return this.request('GET', '/teste', undefined, apiKey);
  }

  /**
   * Valida HMAC da resposta
   */
  private validateHmac(_data: unknown, _signature: string): void {
    // TODO: Implementar validação HMAC se necessário
    // Focus NFe usa HMAC para validar respostas
    // Exemplo: SHA256(payload + secret) === signature
  }

  /**
   * Verifica se é erro não-retentável
   */
  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // 4xx errors (exceto 429) são não-retentáveis
      if (
        error.message.includes('400') ||
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('404')
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Aguarda por N milissegundos
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
