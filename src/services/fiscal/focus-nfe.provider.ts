import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type {
  EmissionResult,
  EventResult,
  FiscalProvider,
  NFeData,
  SefazStatus,
} from './fiscal-provider.interface';

const FOCUS_NFE_API_URL = 'https://api.focusnfe.com.br/v2';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Focus NF-e Provider
 *
 * Integration with the Focus NF-e API (https://api.focusnfe.com.br/v2)
 * Documentation: https://focusnfe.com.br/doc/
 *
 * Auth: Bearer token (API key stored in FiscalConfig.apiKey)
 */
export class FocusNFeProvider implements FiscalProvider {
  readonly providerName = 'FOCUS_NFE';

  /**
   * POST /nfe
   * Emits an NF-e through the Focus NF-e API.
   * Focus uses a client-generated `ref` to track the document.
   */
  async emitNFe(nfeData: NFeData): Promise<EmissionResult> {
    const nfePayload = this.buildNFePayload(nfeData, 'NFE');
    const documentRef = this.buildDocumentRef(nfeData);

    const responseBody = await this.request(
      nfeData.config.apiKey,
      'POST',
      `/nfe?ref=${documentRef}`,
      nfePayload,
    );

    return this.mapEmissionResponse(responseBody, documentRef);
  }

  /**
   * POST /nfce
   * Emits an NFC-e through the Focus NF-e API.
   */
  async emitNFCe(nfceData: NFeData): Promise<EmissionResult> {
    const nfcePayload = this.buildNFePayload(nfceData, 'NFCE');

    if (nfceData.config.nfceCscId && nfceData.config.nfceCscToken) {
      (nfcePayload as Record<string, unknown>).id_token_csc =
        nfceData.config.nfceCscId;
      (nfcePayload as Record<string, unknown>).csc =
        nfceData.config.nfceCscToken;
    }

    const documentRef = this.buildDocumentRef(nfceData);

    const responseBody = await this.request(
      nfceData.config.apiKey,
      'POST',
      `/nfce?ref=${documentRef}`,
      nfcePayload,
    );

    return this.mapEmissionResponse(responseBody, documentRef);
  }

  /**
   * DELETE /nfe/{ref}
   * Cancels a previously authorized NF-e.
   * Focus uses DELETE with a justification in the body.
   */
  async cancelDocument(
    accessKey: string,
    reason: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config.apiKey,
      'DELETE',
      `/nfe/${accessKey}`,
      { justificativa: reason },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * POST /nfe/{ref}/carta_correcao
   * Sends a correction letter (CC-e) for an authorized NF-e.
   */
  async correctionLetter(
    accessKey: string,
    correctionText: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config.apiKey,
      'POST',
      `/nfe/${accessKey}/carta_correcao`,
      { correcao: correctionText },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * POST /nfe/inutilizacao
   * Voids a range of unused NF-e numbers.
   * Focus NF-e does not have a dedicated inutilizacao endpoint;
   * it is handled through POST /nfe_inutilizacoes with a ref.
   */
  async voidNumberRange(
    series: number,
    startNumber: number,
    endNumber: number,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const voidRef = `inut_${series}_${startNumber}_${endNumber}`;

    const responseBody = await this.request(
      config.apiKey,
      'POST',
      `/nfe_inutilizacoes?ref=${voidRef}`,
      {
        serie: series,
        numero_inicial: startNumber,
        numero_final: endNumber,
        justificativa: 'Inutilizacao de numeracao nao utilizada',
      },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * GET /nfe/{ref}
   * Queries the status of a fiscal document.
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
      status: this.mapFocusStatus(responseBody.status as string),
      xml: responseBody.xml as string | undefined,
    };
  }

  /**
   * GET /nfe/{ref}/pdf
   * Generates and downloads the DANFE PDF.
   */
  async generateDanfe(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<Buffer> {
    const httpResponse = await fetch(
      `${FOCUS_NFE_API_URL}/nfe/${accessKey}/pdf`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/pdf',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.text().catch(() => '');
      throw new Error(
        `Focus NF-e DANFE generation failed (${httpResponse.status}): ${errorBody}`,
      );
    }

    const pdfArrayBuffer = await httpResponse.arrayBuffer();
    return Buffer.from(pdfArrayBuffer);
  }

  /**
   * Focus NF-e does not provide a direct SEFAZ status check endpoint.
   * We attempt a lightweight request and measure response time.
   */
  async checkSefazStatus(_uf: string): Promise<SefazStatus> {
    const startTimestamp = Date.now();

    try {
      const httpResponse = await fetch(`${FOCUS_NFE_API_URL}/`, {
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

  private buildDocumentRef(nfeData: NFeData): string {
    return `${nfeData.document.series}-${nfeData.document.number}`;
  }

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
      icms_situacao_tributaria: fiscalItem.cst,
      icms_base_calculo: fiscalItem.icmsBase,
      icms_aliquota: fiscalItem.icmsRate,
      icms_valor: fiscalItem.icmsValue,
      ipi_base_calculo: fiscalItem.ipiBase,
      ipi_aliquota: fiscalItem.ipiRate,
      ipi_valor: fiscalItem.ipiValue,
      pis_situacao_tributaria: '01',
      pis_base_calculo: fiscalItem.pisBase,
      pis_aliquota: fiscalItem.pisRate,
      pis_valor: fiscalItem.pisValue,
      cofins_situacao_tributaria: '01',
      cofins_base_calculo: fiscalItem.cofinsBase,
      cofins_aliquota: fiscalItem.cofinsRate,
      cofins_valor: fiscalItem.cofinsValue,
    }));

    const recipientDocumentKey =
      document.recipientCnpjCpf.length <= 11 ? 'cpf' : 'cnpj';

    return {
      natureza_operacao: document.naturezaOperacao,
      tipo_documento: documentType === 'NFE' ? 1 : 65,
      finalidade_emissao: 1,
      regime_tributario: taxRegimeMap[config.taxRegime] || 1,
      serie: document.series,
      numero: document.number,
      destinatario: {
        [recipientDocumentKey]: document.recipientCnpjCpf,
        nome: document.recipientName,
        inscricao_estadual: document.recipientIe || undefined,
      },
      items: nfeItems,
      valor_produtos: document.totalProducts,
      valor_desconto: document.totalDiscount,
      valor_frete: document.totalShipping,
      valor_total_tributos: document.totalTax,
      valor_total: document.totalValue,
      informacoes_adicionais_contribuinte: document.additionalInfo || undefined,
    };
  }

  private mapEmissionResponse(
    responseBody: Record<string, unknown>,
    documentRef: string,
  ): EmissionResult {
    const focusStatus = responseBody.status as string | undefined;
    const statusAuthorized =
      focusStatus === 'autorizado' || focusStatus === 'processando_autorizacao';

    if (statusAuthorized) {
      return {
        success: true,
        accessKey: responseBody.chave_nfe as string | undefined,
        protocolNumber:
          responseBody.numero_protocolo as string | undefined,
        protocolDate: responseBody.data_protocolo
          ? new Date(responseBody.data_protocolo as string)
          : undefined,
        xmlAuthorized: responseBody.xml as string | undefined,
        externalId: documentRef,
      };
    }

    return {
      success: false,
      errorCode: (responseBody.codigo as string) || undefined,
      errorMessage:
        (responseBody.mensagem as string) ||
        (responseBody.erros_validacao as string) ||
        'NF-e emission failed via Focus NF-e',
    };
  }

  private mapEventResponse(
    responseBody: Record<string, unknown>,
  ): EventResult {
    const focusStatus = responseBody.status as string | undefined;
    const eventSucceeded =
      focusStatus === 'cancelado' ||
      focusStatus === 'autorizado' ||
      focusStatus === 'processando';

    return {
      success: eventSucceeded,
      protocol: responseBody.numero_protocolo as string | undefined,
      xml: responseBody.xml as string | undefined,
      errorCode: eventSucceeded
        ? undefined
        : (responseBody.codigo as string | undefined),
      errorMessage: eventSucceeded
        ? undefined
        : (responseBody.mensagem as string | undefined),
    };
  }

  private mapFocusStatus(focusStatus: string | undefined): string {
    if (!focusStatus) return 'UNKNOWN';

    const statusMap: Record<string, string> = {
      autorizado: 'AUTHORIZED',
      cancelado: 'CANCELLED',
      processando_autorizacao: 'PROCESSING',
      erro_autorizacao: 'REJECTED',
      processando_cancelamento: 'PROCESSING',
    };

    return statusMap[focusStatus] || focusStatus.toUpperCase();
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
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const httpResponse = await fetch(
      `${FOCUS_NFE_API_URL}${path}`,
      requestOptions,
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Focus NF-e API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
