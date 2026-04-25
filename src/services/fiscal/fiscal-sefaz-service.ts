import type { Order } from '@/entities/sales/order';
import type { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import type { PosFiscalDocumentTypeValue } from '@/entities/sales/value-objects/pos-fiscal-document-type';

/**
 * Result of a successful (or rejected) NFC-e emission attempt against the
 * SEFAZ pipeline. Modeled as a discriminated union so the use case can branch
 * on `status` without inspecting optional fields.
 *
 * Fase 1 (Emporion Plan A — Task 32) ships only the AUTHORIZED branch via
 * the in-memory mock. Future production providers will populate REJECTED with
 * the SEFAZ rejection code/message.
 */
export type FiscalEmissionStatus = 'AUTHORIZED' | 'REJECTED';

export interface FiscalEmissionAuthorized {
  status: 'AUTHORIZED';
  documentType: PosFiscalDocumentTypeValue;
  documentNumber: number;
  /** 44-digit numeric NFC-e access key (chave de acesso). */
  accessKey: string;
  /** Authorization protocol returned by SEFAZ. */
  authorizationProtocol: string;
  /** Authorized XML envelope. Mocked as `<mock/>` in Fase 1. */
  xml: string;
}

export interface FiscalEmissionRejected {
  status: 'REJECTED';
  /** SEFAZ rejection code (e.g. "539", "204"). */
  errorCode: string;
  /** Human-readable rejection message. */
  errorMessage: string;
}

export type FiscalEmissionResult =
  | FiscalEmissionAuthorized
  | FiscalEmissionRejected;

export interface EmitNfceRequest {
  order: Order;
  fiscalConfig: PosFiscalConfig;
  /**
   * The NF-C-e number that has already been reserved for this emission by the
   * caller (typically via `posFiscalConfigsRepository.incrementNfceNumber`).
   * Passing it in keeps SEFAZ side-effects deterministic from the caller's
   * point of view: the use case owns the counter and the service is
   * responsible only for the transport.
   */
  documentNumber: number;
}

/**
 * Adapter contract for the SEFAZ NFC-e emission pipeline. Implementations are
 * responsible for marshaling the Order into an NFC-e envelope, transmitting
 * it to SEFAZ (online sync mode in Fase 1), and translating the response
 * back into a {@link FiscalEmissionResult}.
 *
 * The service is intentionally narrower than the broader `FiscalProvider`
 * interface (`src/services/fiscal/fiscal-provider.interface.ts`) used by the
 * standalone NF-e module: this contract is the slim boundary the POS use
 * case relies on, with a SEFAZ mock as the Fase 1 implementation.
 */
export interface FiscalSefazService {
  emitNfce(request: EmitNfceRequest): Promise<FiscalEmissionResult>;
}

/**
 * Generates a 44-digit numeric NFC-e access key. Real SEFAZ keys follow a
 * very specific layout (UF, AAMM, CNPJ, model, série, número, tpEmis, cNF,
 * cDV) and are signed/validated by the issuer. The mock simply returns 44
 * random numeric characters because no part of the system actually validates
 * the layout in Fase 1; downstream consumers only require the value to be a
 * 44-character numeric string they can persist on the Order.
 */
export function generateMockAccessKey(): string {
  let key = '';
  for (let digitIndex = 0; digitIndex < 44; digitIndex++) {
    key += Math.floor(Math.random() * 10).toString();
  }
  return key;
}
