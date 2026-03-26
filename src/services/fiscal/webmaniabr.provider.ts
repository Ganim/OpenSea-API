import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type {
  EmissionResult,
  EventResult,
  FiscalProvider,
  NFeData,
  SefazStatus,
} from './fiscal-provider.interface';

const WEBMANIABR_API_URL = 'https://webmaniabr.com/api/1/nfe';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * WebmaniaBR Provider
 *
 * Integration with the WebmaniaBR API (https://webmaniabr.com/api/1/nfe)
 * Documentation: https://webmaniabr.com/docs/rest-api-nfe/
 *
 * Auth: Custom headers x-consumer-key (apiKey) + x-consumer-secret (apiSecret)
 */
export class WebmaniaBRProvider implements FiscalProvider {
  readonly providerName = 'WEBMANIABR';

  /**
   * POST /emissao/
   * Emits an NF-e through the WebmaniaBR API.
   */
  async emitNFe(nfeData: NFeData): Promise<EmissionResult> {
    const nfePayload = this.buildNFePayload(nfeData, 'NFE');

    const responseBody = await this.request(
      nfeData.config,
      'POST',
      '/emissao/',
      nfePayload,
    );

    return this.mapEmissionResponse(responseBody);
  }

  /**
   * POST /emissao/
   * Emits an NFC-e through the WebmaniaBR API.
   * WebmaniaBR uses the same endpoint for NF-e and NFC-e,
   * distinguished by the modelo field (55 for NF-e, 65 for NFC-e).
   */
  async emitNFCe(nfceData: NFeData): Promise<EmissionResult> {
    const nfcePayload = this.buildNFePayload(nfceData, 'NFCE');

    if (nfceData.config.nfceCscId && nfceData.config.nfceCscToken) {
      (nfcePayload as Record<string, unknown>).token_csc =
        nfceData.config.nfceCscId;
      (nfcePayload as Record<string, unknown>).codigo_csc =
        nfceData.config.nfceCscToken;
    }

    const responseBody = await this.request(
      nfceData.config,
      'POST',
      '/emissao/',
      nfcePayload,
    );

    return this.mapEmissionResponse(responseBody);
  }

  /**
   * PUT /cancelar/
   * Cancels a previously authorized fiscal document.
   */
  async cancelDocument(
    accessKey: string,
    reason: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(config, 'PUT', '/cancelar/', {
      chave: accessKey,
      justificativa: reason,
    });

    return this.mapEventResponse(responseBody);
  }

  /**
   * PUT /cartacorrecao/
   * Sends a correction letter (CC-e) for an authorized NF-e.
   */
  async correctionLetter(
    accessKey: string,
    correctionText: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config,
      'PUT',
      '/cartacorrecao/',
      {
        chave: accessKey,
        correcao: correctionText,
      },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * PUT /inutilizar/
   * Voids a range of unused NF-e numbers.
   */
  async voidNumberRange(
    series: number,
    startNumber: number,
    endNumber: number,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(config, 'PUT', '/inutilizar/', {
      serie: series,
      numero_inicial: startNumber,
      numero_final: endNumber,
      justificativa: 'Inutilizacao de numeracao nao utilizada',
    });

    return this.mapEventResponse(responseBody);
  }

  /**
   * GET /consulta/
   * Queries the status of a fiscal document.
   */
  async queryDocument(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<{ status: string; xml?: string }> {
    const responseBody = await this.request(
      config,
      'GET',
      `/consulta/?chave=${accessKey}`,
    );

    return {
      status: this.mapWebmaniaStatus(responseBody.situacao as string),
      xml: responseBody.xml as string | undefined,
    };
  }

  /**
   * GET /danfe/
   * Generates and downloads the DANFE PDF.
   * WebmaniaBR returns a URL to the PDF rather than the binary itself.
   */
  async generateDanfe(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<Buffer> {
    const responseBody = await this.request(
      config,
      'GET',
      `/danfe/?chave=${accessKey}`,
    );

    const danfeUrl = responseBody.danfe as string | undefined;

    if (!danfeUrl) {
      throw new Error(
        'WebmaniaBR DANFE generation failed: no PDF URL returned',
      );
    }

    // Download the actual PDF from the returned URL
    const pdfResponse = await fetch(danfeUrl, {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!pdfResponse.ok) {
      throw new Error(
        `WebmaniaBR DANFE download failed (${pdfResponse.status})`,
      );
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    return Buffer.from(pdfArrayBuffer);
  }

  /**
   * WebmaniaBR does not provide a dedicated SEFAZ status endpoint.
   * We perform a lightweight health check against the API.
   */
  async checkSefazStatus(_uf: string): Promise<SefazStatus> {
    const startTimestamp = Date.now();

    try {
      const httpResponse = await fetch(`${WEBMANIABR_API_URL}/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });

      const elapsedMs = Date.now() - startTimestamp;

      return {
        online: httpResponse.ok || httpResponse.status === 401,
        responseTimeMs: elapsedMs,
      };
    } catch {
      return {
        online: false,
        responseTimeMs: Date.now() - startTimestamp,
      };
    }
  }

  // -- Private helpers --

  private buildNFePayload(
    nfeData: NFeData,
    documentType: 'NFE' | 'NFCE',
  ): Record<string, unknown> {
    const { config, document, items } = nfeData;

    const taxRegimeMap: Record<string, number> = {
      SIMPLES_NACIONAL: 1,
      SIMPLES_NACIONAL_EXCESSO: 2,
      LUCRO_PRESUMIDO: 3,
      LUCRO_REAL: 3,
      MEI: 1,
    };

    const nfeItems = items.map((fiscalItem) => ({
      nome: fiscalItem.productName,
      codigo: fiscalItem.productCode,
      ncm: fiscalItem.ncm,
      cest: fiscalItem.cest || undefined,
      cfop: fiscalItem.cfop,
      unidade: 'UN',
      quantidade: fiscalItem.quantity,
      subtotal: fiscalItem.unitPrice,
      total: fiscalItem.totalPrice,
      desconto: fiscalItem.discount,
      impostos: {
        icms: {
          situacao_tributaria: fiscalItem.cst,
          base_calculo: fiscalItem.icmsBase,
          aliquota: fiscalItem.icmsRate,
          valor: fiscalItem.icmsValue,
        },
        ipi: {
          base_calculo: fiscalItem.ipiBase,
          aliquota: fiscalItem.ipiRate,
          valor: fiscalItem.ipiValue,
        },
        pis: {
          situacao_tributaria: '01',
          base_calculo: fiscalItem.pisBase,
          aliquota: fiscalItem.pisRate,
          valor: fiscalItem.pisValue,
        },
        cofins: {
          situacao_tributaria: '01',
          base_calculo: fiscalItem.cofinsBase,
          aliquota: fiscalItem.cofinsRate,
          valor: fiscalItem.cofinsValue,
        },
      },
    }));

    const recipientDocumentKey =
      document.recipientCnpjCpf.length <= 11 ? 'cpf' : 'cnpj';

    return {
      operacao: 1,
      natureza_operacao: document.naturezaOperacao,
      modelo: documentType === 'NFE' ? 1 : 2,
      finalidade: 1,
      ambiente: config.environment === 'PRODUCTION' ? 1 : 2,
      regime_tributario: taxRegimeMap[config.taxRegime] || 1,
      serie: document.series,
      numero: document.number,
      cliente: {
        [recipientDocumentKey]: document.recipientCnpjCpf,
        nome_completo: document.recipientName,
        inscricao_estadual: document.recipientIe || undefined,
      },
      produtos: nfeItems,
      pedido: {
        presenca: documentType === 'NFCE' ? 1 : 0,
        frete: document.totalShipping,
        desconto: document.totalDiscount,
      },
      informacoes_complementares: document.additionalInfo || undefined,
    };
  }

  private mapEmissionResponse(
    responseBody: Record<string, unknown>,
  ): EmissionResult {
    const webmaniaStatus = responseBody.status as string | undefined;
    const statusAuthorized =
      webmaniaStatus === 'aprovado' || webmaniaStatus === 'processamento';

    if (statusAuthorized) {
      return {
        success: true,
        accessKey: responseBody.chave as string | undefined,
        protocolNumber:
          responseBody.recibo as string | undefined,
        protocolDate: responseBody.data as string
          ? new Date(responseBody.data as string)
          : undefined,
        xmlAuthorized: responseBody.xml as string | undefined,
        externalId: responseBody.uuid as string | undefined,
      };
    }

    return {
      success: false,
      errorCode: (responseBody.error as string) || undefined,
      errorMessage:
        (responseBody.log?.toString() as string) ||
        (responseBody.error as string) ||
        'NF-e emission failed via WebmaniaBR',
    };
  }

  private mapEventResponse(
    responseBody: Record<string, unknown>,
  ): EventResult {
    const webmaniaStatus = responseBody.status as string | undefined;
    const eventSucceeded =
      webmaniaStatus === 'aprovado' || webmaniaStatus === 'cancelado';

    return {
      success: eventSucceeded,
      protocol: responseBody.recibo as string | undefined,
      xml: responseBody.xml as string | undefined,
      errorCode: eventSucceeded
        ? undefined
        : (responseBody.error as string | undefined),
      errorMessage: eventSucceeded
        ? undefined
        : ((responseBody.log?.toString() as string) || undefined),
    };
  }

  private mapWebmaniaStatus(webmaniaStatus: string | undefined): string {
    if (!webmaniaStatus) return 'UNKNOWN';

    const statusMap: Record<string, string> = {
      aprovado: 'AUTHORIZED',
      reprovado: 'REJECTED',
      cancelado: 'CANCELLED',
      processamento: 'PROCESSING',
      contingencia: 'CONTINGENCY',
      denegado: 'DENIED',
    };

    return statusMap[webmaniaStatus] || webmaniaStatus.toUpperCase();
  }

  private async request(
    config: FiscalConfig,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      'x-consumer-key': config.apiKey,
      'x-consumer-secret': config.apiSecret || '',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const httpResponse = await fetch(
      `${WEBMANIABR_API_URL}${path}`,
      requestOptions,
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `WebmaniaBR API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
