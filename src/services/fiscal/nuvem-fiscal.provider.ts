import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type {
  EmissionResult,
  EventResult,
  FiscalProvider,
  NFeData,
  SefazStatus,
} from './fiscal-provider.interface';

/**
 * Nuvem Fiscal Provider
 *
 * Integration with the Nuvem Fiscal API (https://api.nuvemfiscal.com.br)
 * Documentation: https://dev.nuvemfiscal.com.br/docs/api
 *
 * This is a stub implementation. Each method must be implemented
 * with the actual HTTP calls to the Nuvem Fiscal REST API.
 */
export class NuvemFiscalProvider implements FiscalProvider {
  readonly providerName = 'NUVEM_FISCAL';

  private readonly baseUrl = 'https://api.nuvemfiscal.com.br';

  /**
   * POST /nfe
   * Emits an NF-e through the Nuvem Fiscal API
   */
  async emitNFe(_nfeData: NFeData): Promise<EmissionResult> {
    // TODO: Implement NF-e emission via POST /nfe
    // 1. Build the NF-e XML payload from document + items
    // 2. Send to Nuvem Fiscal API with authorization header
    // 3. Parse response and return EmissionResult
    throw new Error(
      `[${this.providerName}] NF-e emission not configured. Implement POST ${this.baseUrl}/nfe`,
    );
  }

  /**
   * POST /nfce
   * Emits an NFC-e through the Nuvem Fiscal API
   */
  async emitNFCe(_nfceData: NFeData): Promise<EmissionResult> {
    // TODO: Implement NFC-e emission via POST /nfce
    // 1. Build the NFC-e XML payload from document + items + CSC data
    // 2. Send to Nuvem Fiscal API with authorization header
    // 3. Parse response and return EmissionResult
    throw new Error(
      `[${this.providerName}] NFC-e emission not configured. Implement POST ${this.baseUrl}/nfce`,
    );
  }

  /**
   * POST /nfe/{id}/cancelamento
   * Cancels a previously authorized NF-e
   */
  async cancelDocument(
    _accessKey: string,
    _reason: string,
    _config: FiscalConfig,
  ): Promise<EventResult> {
    // TODO: Implement cancellation via POST /nfe/{id}/cancelamento
    // 1. Look up the document by access key
    // 2. Send cancellation request with justification (min 15 chars)
    // 3. Parse response and return EventResult
    throw new Error(
      `[${this.providerName}] Document cancellation not configured. Implement POST ${this.baseUrl}/nfe/{id}/cancelamento`,
    );
  }

  /**
   * POST /nfe/{id}/carta-correcao
   * Sends a correction letter (CC-e) for an authorized NF-e
   */
  async correctionLetter(
    _accessKey: string,
    _correctionText: string,
    _config: FiscalConfig,
  ): Promise<EventResult> {
    // TODO: Implement correction letter via POST /nfe/{id}/carta-correcao
    // 1. Look up the document by access key
    // 2. Send correction text (min 15, max 1000 chars)
    // 3. Parse response and return EventResult
    throw new Error(
      `[${this.providerName}] Correction letter not configured. Implement POST ${this.baseUrl}/nfe/{id}/carta-correcao`,
    );
  }

  /**
   * POST /nfe/inutilizacao
   * Voids a range of unused NF-e numbers
   */
  async voidNumberRange(
    _series: number,
    _startNumber: number,
    _endNumber: number,
    _config: FiscalConfig,
  ): Promise<EventResult> {
    // TODO: Implement inutilization via POST /nfe/inutilizacao
    // 1. Build the inutilization request with series, start, end
    // 2. Send to Nuvem Fiscal API
    // 3. Parse response and return EventResult
    throw new Error(
      `[${this.providerName}] Number range voiding not configured. Implement POST ${this.baseUrl}/nfe/inutilizacao`,
    );
  }

  /**
   * GET /nfe/{id}
   * Queries the status of a fiscal document
   */
  async queryDocument(
    _accessKey: string,
    _config: FiscalConfig,
  ): Promise<{ status: string; xml?: string }> {
    // TODO: Implement document query via GET /nfe/{id}
    // 1. Look up the document by access key or external ID
    // 2. Return current status and authorized XML
    throw new Error(
      `[${this.providerName}] Document query not configured. Implement GET ${this.baseUrl}/nfe/{id}`,
    );
  }

  /**
   * GET /nfe/{id}/pdf
   * Generates and downloads the DANFE PDF
   */
  async generateDanfe(
    _accessKey: string,
    _config: FiscalConfig,
  ): Promise<Buffer> {
    // TODO: Implement DANFE generation via GET /nfe/{id}/pdf
    // 1. Request PDF from Nuvem Fiscal API
    // 2. Return the PDF buffer
    throw new Error(
      `[${this.providerName}] DANFE generation not configured. Implement GET ${this.baseUrl}/nfe/{id}/pdf`,
    );
  }

  /**
   * GET /nfe/sefaz/status
   * Checks if SEFAZ is online for a given state
   */
  async checkSefazStatus(_uf: string): Promise<SefazStatus> {
    // TODO: Implement SEFAZ status check via GET /nfe/sefaz/status
    // 1. Query SEFAZ status for the given UF
    // 2. Return online status and response time
    throw new Error(
      `[${this.providerName}] SEFAZ status check not configured. Implement GET ${this.baseUrl}/nfe/sefaz/status`,
    );
  }
}
