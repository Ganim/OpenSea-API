import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type {
  EmissionResult,
  EventResult,
  FiscalProvider,
  NFeData,
  SefazStatus,
} from './fiscal-provider.interface';

const NUVEM_FISCAL_API_URL = 'https://api.nuvemfiscal.com.br';

/**
 * Nuvem Fiscal Provider
 *
 * Integration with the Nuvem Fiscal API (https://api.nuvemfiscal.com.br)
 * Documentation: https://dev.nuvemfiscal.com.br/docs/api
 *
 * Auth: Bearer token (API key stored in FiscalConfig.apiKey)
 */
export class NuvemFiscalProvider implements FiscalProvider {
  readonly providerName = 'NUVEM_FISCAL';

  /**
   * POST /nfe
   * Emits an NF-e through the Nuvem Fiscal API
   */
  async emitNFe(nfeData: NFeData): Promise<EmissionResult> {
    const nfePayload = this.buildNFePayload(nfeData, 'NFE');

    const responseBody = await this.request(
      nfeData.config.apiKey,
      'POST',
      '/nfe',
      nfePayload,
    );

    return this.mapEmissionResponse(responseBody);
  }

  /**
   * POST /nfce
   * Emits an NFC-e through the Nuvem Fiscal API
   */
  async emitNFCe(nfceData: NFeData): Promise<EmissionResult> {
    const nfcePayload = this.buildNFePayload(nfceData, 'NFCE');

    // Include CSC data for NFC-e
    if (nfceData.config.nfceCscId && nfceData.config.nfceCscToken) {
      (nfcePayload as Record<string, unknown>).idCSC =
        nfceData.config.nfceCscId;
      (nfcePayload as Record<string, unknown>).CSC =
        nfceData.config.nfceCscToken;
    }

    const responseBody = await this.request(
      nfceData.config.apiKey,
      'POST',
      '/nfce',
      nfcePayload,
    );

    return this.mapEmissionResponse(responseBody);
  }

  /**
   * POST /nfe/{id}/cancelamento
   * Cancels a previously authorized NF-e
   */
  async cancelDocument(
    accessKey: string,
    reason: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config.apiKey,
      'POST',
      `/nfe/${accessKey}/cancelamento`,
      { justificativa: reason },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * POST /nfe/{id}/carta-correcao
   * Sends a correction letter (CC-e) for an authorized NF-e
   */
  async correctionLetter(
    accessKey: string,
    correctionText: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config.apiKey,
      'POST',
      `/nfe/${accessKey}/carta-correcao`,
      { correcao: correctionText },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * POST /nfe/inutilizacao
   * Voids a range of unused NF-e numbers
   */
  async voidNumberRange(
    series: number,
    startNumber: number,
    endNumber: number,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config.apiKey,
      'POST',
      '/nfe/inutilizacao',
      {
        ambiente: config.environment === 'PRODUCTION' ? 1 : 2,
        serie: series,
        numero_inicial: startNumber,
        numero_final: endNumber,
      },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * GET /nfe/{id}
   * Queries the status of a fiscal document
   */
  async queryDocument(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<{ status: string; xml?: string }> {
    const responseBody = await this.request(
      config.apiKey,
      'GET',
      `/nfe/${accessKey}`,
    );

    return {
      status: (responseBody.status as string) || 'UNKNOWN',
      xml: responseBody.xml as string | undefined,
    };
  }

  /**
   * GET /nfe/{id}/pdf
   * Generates and downloads the DANFE PDF
   */
  async generateDanfe(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<Buffer> {
    const httpResponse = await fetch(
      `${NUVEM_FISCAL_API_URL}/nfe/${accessKey}/pdf`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/pdf',
        },
      },
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.text().catch(() => '');
      throw new Error(
        `Nuvem Fiscal DANFE generation failed (${httpResponse.status}): ${errorBody}`,
      );
    }

    const pdfArrayBuffer = await httpResponse.arrayBuffer();
    return Buffer.from(pdfArrayBuffer);
  }

  /**
   * GET /nfe/sefaz/status
   * Checks if SEFAZ is online for a given state
   */
  async checkSefazStatus(uf: string): Promise<SefazStatus> {
    // Nuvem Fiscal does not require auth for SEFAZ status checks,
    // but we pass a dummy key to keep the request method consistent.
    // Some implementations may require a valid key.
    const startTimestamp = Date.now();

    try {
      const httpResponse = await fetch(
        `${NUVEM_FISCAL_API_URL}/nfe/sefaz/status?uf=${uf}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const elapsedMs = Date.now() - startTimestamp;

      if (!httpResponse.ok) {
        return { online: false, responseTimeMs: elapsedMs };
      }

      const statusResponse = (await httpResponse.json()) as Record<
        string,
        unknown
      >;
      const sefazOnline =
        (statusResponse.status as string)?.toUpperCase() === 'OPERANDO' ||
        statusResponse.online === true;

      return { online: sefazOnline, responseTimeMs: elapsedMs };
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
      numero_item: fiscalItem.itemNumber,
      codigo_produto: fiscalItem.productCode,
      descricao: fiscalItem.productName,
      ncm: fiscalItem.ncm,
      cest: fiscalItem.cest || undefined,
      cfop: fiscalItem.cfop,
      unidade_comercial: 'UN',
      quantidade_comercial: fiscalItem.quantity,
      valor_unitario_comercial: fiscalItem.unitPrice,
      valor_bruto: fiscalItem.totalPrice,
      valor_desconto: fiscalItem.discount,
      imposto: {
        icms: {
          CST: fiscalItem.cst,
          vBC: fiscalItem.icmsBase,
          pICMS: fiscalItem.icmsRate,
          vICMS: fiscalItem.icmsValue,
        },
        ipi: {
          vBC: fiscalItem.ipiBase,
          pIPI: fiscalItem.ipiRate,
          vIPI: fiscalItem.ipiValue,
        },
        pis: {
          CST: '01',
          vBC: fiscalItem.pisBase,
          pPIS: fiscalItem.pisRate,
          vPIS: fiscalItem.pisValue,
        },
        cofins: {
          CST: '01',
          vBC: fiscalItem.cofinsBase,
          pCOFINS: fiscalItem.cofinsRate,
          vCOFINS: fiscalItem.cofinsValue,
        },
      },
    }));

    const recipientDocumentKey =
      document.recipientCnpjCpf.length <= 11 ? 'cpf' : 'cnpj';

    return {
      ambiente: config.environment === 'PRODUCTION' ? 1 : 2,
      tipo_documento: documentType === 'NFE' ? 1 : 65,
      natureza_operacao: document.naturezaOperacao,
      serie: document.series,
      numero: document.number,
      regime_tributario: taxRegimeMap[config.taxRegime] || 1,
      destinatario: {
        [recipientDocumentKey]: document.recipientCnpjCpf,
        nome: document.recipientName,
        inscricao_estadual: document.recipientIe || undefined,
      },
      itens: nfeItems,
      totais: {
        valor_produtos: document.totalProducts,
        valor_desconto: document.totalDiscount,
        valor_frete: document.totalShipping,
        valor_total_tributos: document.totalTax,
        valor_total: document.totalValue,
      },
      informacoes_adicionais: document.additionalInfo || undefined,
    };
  }

  private mapEmissionResponse(
    responseBody: Record<string, unknown>,
  ): EmissionResult {
    const statusAuthorized =
      (responseBody.status as string) === 'autorizado' ||
      (responseBody.status as string) === 'autorizada';

    if (statusAuthorized) {
      return {
        success: true,
        accessKey: responseBody.chave as string | undefined,
        protocolNumber: responseBody.numero_protocolo as string | undefined,
        protocolDate: responseBody.data_protocolo
          ? new Date(responseBody.data_protocolo as string)
          : undefined,
        xmlAuthorized: responseBody.xml as string | undefined,
        externalId: responseBody.id as string | undefined,
      };
    }

    return {
      success: false,
      errorCode: responseBody.codigo_erro as string | undefined,
      errorMessage:
        (responseBody.mensagem_erro as string) ||
        (responseBody.mensagem as string) ||
        'NF-e emission failed',
    };
  }

  private mapEventResponse(responseBody: Record<string, unknown>): EventResult {
    const eventSucceeded =
      (responseBody.status as string) === 'sucesso' ||
      (responseBody.status as string) === 'aprovado';

    return {
      success: eventSucceeded,
      protocol: responseBody.numero_protocolo as string | undefined,
      xml: responseBody.xml as string | undefined,
      errorCode: eventSucceeded
        ? undefined
        : (responseBody.codigo_erro as string | undefined),
      errorMessage: eventSucceeded
        ? undefined
        : (responseBody.mensagem_erro as string | undefined),
    };
  }

  private async request(
    apiKey: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const httpResponse = await fetch(
      `${NUVEM_FISCAL_API_URL}${path}`,
      requestOptions,
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Nuvem Fiscal API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
