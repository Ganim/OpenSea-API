import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import type { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';

export interface NFeData {
  config: FiscalConfig;
  document: FiscalDocument;
  items: FiscalDocumentItem[];
}

export interface EmissionResult {
  success: boolean;
  accessKey?: string;
  protocolNumber?: string;
  protocolDate?: Date;
  xmlAuthorized?: string;
  externalId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface EventResult {
  success: boolean;
  protocol?: string;
  xml?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SefazStatus {
  online: boolean;
  responseTimeMs?: number;
}

export interface FiscalProvider {
  readonly providerName: string;

  /** Emit an NF-e (Nota Fiscal Eletronica) */
  emitNFe(nfeData: NFeData): Promise<EmissionResult>;

  /** Emit an NFC-e (Nota Fiscal de Consumidor Eletronica) */
  emitNFCe(nfceData: NFeData): Promise<EmissionResult>;

  /** Cancel a previously authorized fiscal document */
  cancelDocument(
    accessKey: string,
    reason: string,
    config: FiscalConfig,
  ): Promise<EventResult>;

  /** Send a correction letter (Carta de Correcao) for an NF-e */
  correctionLetter(
    accessKey: string,
    correctionText: string,
    config: FiscalConfig,
  ): Promise<EventResult>;

  /** Inutilize (void) a range of fiscal document numbers */
  voidNumberRange(
    series: number,
    startNumber: number,
    endNumber: number,
    config: FiscalConfig,
  ): Promise<EventResult>;

  /** Query the current status of a fiscal document at SEFAZ */
  queryDocument(
    accessKey: string,
    config: FiscalConfig,
  ): Promise<{ status: string; xml?: string }>;

  /** Generate a DANFE PDF for a given access key */
  generateDanfe(accessKey: string, config: FiscalConfig): Promise<Buffer>;

  /** Check if SEFAZ is online for a given state (UF) */
  checkSefazStatus(uf: string): Promise<SefazStatus>;
}
