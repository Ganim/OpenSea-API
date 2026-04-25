import type {
  EmitNfceRequest,
  FiscalEmissionResult,
  FiscalSefazService,
} from './fiscal-sefaz-service';
import { generateMockAccessKey } from './fiscal-sefaz-service';

/**
 * NOTE — Parallel-infra disclaimer (Emporion Plan A — Task 32):
 * The repository ALREADY ships a broader `FiscalProvider` abstraction in
 * `src/services/fiscal/fiscal-provider.interface.ts` with concrete adapters
 * (FocusNFe, NFeWizard, NuvemFiscal, WebmaniaBR) for the standalone NF-e
 * module. Fase 1 deliberately ships a slimmer `FiscalSefazService` boundary
 * (this file) so the POS use case can land without coupling to the broader
 * NF-e module's lifecycle. Fase 2 will unify both abstractions and route POS
 * emissions through the existing provider stack.
 *
 * In-process mock of the SEFAZ NFC-e emission pipeline used during Emporion
 * Fase 1 (Plan A — Task 32). It is not a stub: it is the authoritative
 * implementation used by the live `POST /v1/pos/fiscal/emit` endpoint until
 * a real provider lands in a later phase.
 *
 * Behavior:
 *  - Always returns `AUTHORIZED`.
 *  - The 44-character `accessKey` is freshly randomized per call (so two
 *    consecutive emissions never collide).
 *  - The `authorizationProtocol` carries a millisecond timestamp so the
 *    caller can correlate the response with logs even though the value is
 *    fake.
 *  - The `xml` payload is `<mock/>` — there is no real signed envelope.
 *
 * This shape is what the use case (and the controller transitively) relies
 * on, so swapping in a real provider is just a matter of reusing the
 * `FiscalSefazService` interface without touching the use case.
 */
export class MockedFiscalSefazService implements FiscalSefazService {
  async emitNfce(request: EmitNfceRequest): Promise<FiscalEmissionResult> {
    return {
      status: 'AUTHORIZED',
      documentType: request.fiscalConfig.defaultDocumentType.value,
      documentNumber: request.documentNumber,
      accessKey: generateMockAccessKey(),
      authorizationProtocol: `mock-prot-${Date.now()}`,
      xml: '<mock/>',
    };
  }
}
