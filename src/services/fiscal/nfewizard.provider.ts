import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type {
  EmissionResult,
  EventResult,
  FiscalProvider,
  NFeData,
  SefazStatus,
} from './fiscal-provider.interface';

const NFEWIZARD_API_URL = 'https://api.nfewizard.com.br/v1';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * NFeWizard Provider
 *
 * Integration with the NFeWizard API (https://api.nfewizard.com.br/v1)
 * Documentation: https://docs.nfewizard.com.br/
 *
 * Auth: Bearer token (API key stored in FiscalConfig.apiKey)
 */
export class NFeWizardProvider implements FiscalProvider {
  readonly providerName = 'NFEWIZARD';

  /**
   * POST /nfe/emitir
   * Emits an NF-e through the NFeWizard API.
   */
  async emitNFe(nfeData: NFeData): Promise<EmissionResult> {
    const nfePayload = this.buildNFePayload(nfeData, 'NFE');

    const responseBody = await this.request(
      nfeData.config.apiKey,
      'POST',
      '/nfe/emitir',
      nfePayload,
    );

    return this.mapEmissionResponse(responseBody);
  }

  /**
   * POST /nfce/emitir
   * Emits an NFC-e through the NFeWizard API.
   */
  async emitNFCe(nfceData: NFeData): Promise<EmissionResult> {
    const nfcePayload = this.buildNFePayload(nfceData, 'NFCE');

    if (nfceData.config.nfceCscId && nfceData.config.nfceCscToken) {
      (nfcePayload as Record<string, unknown>).csc_id =
        nfceData.config.nfceCscId;
      (nfcePayload as Record<string, unknown>).csc_token =
        nfceData.config.nfceCscToken;
    }

    const responseBody = await this.request(
      nfceData.config.apiKey,
      'POST',
      '/nfce/emitir',
      nfcePayload,
    );

    return this.mapEmissionResponse(responseBody);
  }

  /**
   * POST /nfe/cancelar
   * Cancels a previously authorized fiscal document.
   */
  async cancelDocument(
    accessKey: string,
    reason: string,
    config: FiscalConfig,
  ): Promise<EventResult> {
    const responseBody = await this.request(
      config.apiKey,
      'POST',
      '/nfe/cancelar',
      {
        chave_acesso: accessKey,
        justificativa: reason,
      },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * POST /nfe/carta-correcao
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
      '/nfe/carta-correcao',
      {
        chave_acesso: accessKey,
        correcao: correctionText,
      },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * POST /nfe/inutilizar
   * Voids a range of unused NF-e numbers.
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
      '/nfe/inutilizar',
      {
        ambiente: config.environment === 'PRODUCTION' ? 1 : 2,
        serie: series,
        numero_inicial: startNumber,
        numero_final: endNumber,
        justificativa: 'Inutilizacao de numeracao nao utilizada',
      },
    );

    return this.mapEventResponse(responseBody);
  }

  /**
   * GET /nfe/consultar
   * Queries the status of a fiscal document.
   */
  async queryDocument(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<{ status: string; xml?: string }> {
    const responseBody = await this.request(
      config.apiKey,
      'GET',
      `/nfe/consultar?chave_acesso=${accessKey}`,
    );

    return {
      status: this.mapWizardStatus(responseBody.status as string),
      xml: responseBody.xml as string | undefined,
    };
  }

  /**
   * GET /nfe/danfe
   * Generates and downloads the DANFE PDF.
   */
  async generateDanfe(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<Buffer> {
    const httpResponse = await fetch(
      `${NFEWIZARD_API_URL}/nfe/danfe?chave_acesso=${accessKey}`,
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
      // Some providers return JSON with a PDF URL instead of the binary
      const contentType = httpResponse.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const jsonBody = (await httpResponse.json()) as Record<string, unknown>;
        const pdfUrl = jsonBody.url as string | undefined;

        if (pdfUrl) {
          const pdfDownload = await fetch(pdfUrl, {
            method: 'GET',
            headers: { Accept: 'application/pdf' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });

          if (!pdfDownload.ok) {
            throw new Error(
              `NFeWizard DANFE download failed (${pdfDownload.status})`,
            );
          }

          const pdfArrayBuffer = await pdfDownload.arrayBuffer();
          return Buffer.from(pdfArrayBuffer);
        }
      }

      const errorBody = await httpResponse.text().catch(() => '');
      throw new Error(
        `NFeWizard DANFE generation failed (${httpResponse.status}): ${errorBody}`,
      );
    }

    const pdfArrayBuffer = await httpResponse.arrayBuffer();
    return Buffer.from(pdfArrayBuffer);
  }

  /**
   * GET /sefaz/status
   * Checks if SEFAZ is online for a given state.
   */
  async checkSefazStatus(uf: string): Promise<SefazStatus> {
    const startTimestamp = Date.now();

    try {
      const httpResponse = await fetch(
        `${NFEWIZARD_API_URL}/sefaz/status?uf=${uf}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
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
        (statusResponse.status as string)?.toLowerCase() === 'operando' ||
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
      unidade: 'UN',
      quantidade: fiscalItem.quantity,
      valor_unitario: fiscalItem.unitPrice,
      valor_total: fiscalItem.totalPrice,
      desconto: fiscalItem.discount,
      tributos: {
        icms: {
          cst: fiscalItem.cst,
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
          cst: '01',
          base_calculo: fiscalItem.pisBase,
          aliquota: fiscalItem.pisRate,
          valor: fiscalItem.pisValue,
        },
        cofins: {
          cst: '01',
          base_calculo: fiscalItem.cofinsBase,
          aliquota: fiscalItem.cofinsRate,
          valor: fiscalItem.cofinsValue,
        },
      },
    }));

    const recipientDocumentKey =
      document.recipientCnpjCpf.length <= 11 ? 'cpf' : 'cnpj';

    return {
      ambiente: config.environment === 'PRODUCTION' ? 1 : 2,
      modelo: documentType === 'NFE' ? 55 : 65,
      natureza_operacao: document.naturezaOperacao,
      serie: document.series,
      numero: document.number,
      regime_tributario: taxRegimeMap[config.taxRegime] || 1,
      destinatario: {
        documento: document.recipientCnpjCpf,
        tipo_documento: recipientDocumentKey,
        nome: document.recipientName,
        inscricao_estadual: document.recipientIe || undefined,
      },
      itens: nfeItems,
      totais: {
        valor_produtos: document.totalProducts,
        valor_desconto: document.totalDiscount,
        valor_frete: document.totalShipping,
        valor_tributos: document.totalTax,
        valor_total: document.totalValue,
      },
      informacoes_adicionais: document.additionalInfo || undefined,
    };
  }

  private mapEmissionResponse(
    responseBody: Record<string, unknown>,
  ): EmissionResult {
    const wizardStatus = responseBody.status as string | undefined;
    const statusAuthorized =
      wizardStatus === 'autorizado' ||
      wizardStatus === 'autorizada' ||
      wizardStatus === 'aprovado';

    if (statusAuthorized) {
      return {
        success: true,
        accessKey: responseBody.chave_acesso as string | undefined,
        protocolNumber: responseBody.protocolo as string | undefined,
        protocolDate: responseBody.data_autorizacao
          ? new Date(responseBody.data_autorizacao as string)
          : undefined,
        xmlAuthorized: responseBody.xml as string | undefined,
        externalId: responseBody.id as string | undefined,
      };
    }

    return {
      success: false,
      errorCode: (responseBody.codigo_erro as string) || undefined,
      errorMessage:
        (responseBody.mensagem as string) ||
        (responseBody.erro as string) ||
        'NF-e emission failed via NFeWizard',
    };
  }

  private mapEventResponse(responseBody: Record<string, unknown>): EventResult {
    const wizardStatus = responseBody.status as string | undefined;
    const eventSucceeded =
      wizardStatus === 'sucesso' ||
      wizardStatus === 'aprovado' ||
      wizardStatus === 'cancelado';

    return {
      success: eventSucceeded,
      protocol: responseBody.protocolo as string | undefined,
      xml: responseBody.xml as string | undefined,
      errorCode: eventSucceeded
        ? undefined
        : (responseBody.codigo_erro as string | undefined),
      errorMessage: eventSucceeded
        ? undefined
        : (responseBody.mensagem as string | undefined),
    };
  }

  private mapWizardStatus(wizardStatus: string | undefined): string {
    if (!wizardStatus) return 'UNKNOWN';

    const statusMap: Record<string, string> = {
      autorizado: 'AUTHORIZED',
      autorizada: 'AUTHORIZED',
      cancelado: 'CANCELLED',
      cancelada: 'CANCELLED',
      processando: 'PROCESSING',
      rejeitado: 'REJECTED',
      rejeitada: 'REJECTED',
      denegado: 'DENIED',
      denegada: 'DENIED',
    };

    return statusMap[wizardStatus] || wizardStatus.toUpperCase();
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
      `${NFEWIZARD_API_URL}${path}`,
      requestOptions,
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `NFeWizard API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
