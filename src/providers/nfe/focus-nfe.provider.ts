import type {
  CancelInvoiceInput,
  CancelInvoiceResponse,
  CheckStatusInput,
  CheckStatusResponse,
  CreateInvoiceInput,
  CreateInvoiceResponse,
  TestConnectionResponse,
} from './focus-nfe.types';

/**
 * Interface abstrata para provedores de NF-e/NFC-e
 * Implementada pelo Focus NFe REST client
 */
export interface IFocusNfeProvider {
  /**
   * Emite uma nova NF-e ou NFC-e
   */
  createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResponse>;

  /**
   * Verifica o status de uma nota fiscal emitida
   */
  checkStatus(input: CheckStatusInput): Promise<CheckStatusResponse>;

  /**
   * Cancela uma nota fiscal
   */
  cancelInvoice(input: CancelInvoiceInput): Promise<CancelInvoiceResponse>;

  /**
   * Testa a conexão com a API
   */
  testConnection(apiKey: string, production?: boolean): Promise<TestConnectionResponse>;
}
