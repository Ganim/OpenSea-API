import { randomBytes } from 'node:crypto';

import { broadcastToPrintServer } from '@/lib/websocket/print-agent-connections';

/**
 * Input contract for {@link PrintServerReceiptClient.printReceipt}.
 *
 * `escposData` is the raw ESC/POS byte stream produced by the receipt
 * renderer (cuts, fonts, barcodes, QR, drawer kicks, etc. are already
 * encoded into the buffer). The client encodes it as base64 before
 * shipping it through the WebSocket so that JSON transport stays safe.
 */
export interface PrintReceiptInput {
  /** Tenant whose connected PrintServer(s) should receive the command. */
  tenantId: string;
  /** Target printer identifier (resolved by the PrintServer locally). */
  printerId: string;
  /** Raw ESC/POS payload — base64-encoded by the client before send. */
  escposData: Buffer;
  /** Number of physical copies to print. Defaults to 1. */
  copies?: number;
}

export interface PrintReceiptOutput {
  /** Server-generated identifier returned to the caller for tracking. */
  jobId: string;
}

/**
 * Function that delivers an outbound command to every PrintServer
 * connected for a tenant. Returns `true` if at least one agent received
 * the message, `false` if no PrintServer is connected.
 *
 * Extracted into a type so unit specs can inject a mock without booting
 * the WebSocket server.
 */
export type BroadcastToPrintServerFn = (
  tenantId: string,
  command: Record<string, unknown>,
) => boolean;

/**
 * Error thrown when no PrintServer is currently connected for the
 * tenant — the caller cannot dispatch a receipt because there is no
 * peer to print it.
 */
export class NoPrintServerConnectedError extends Error {
  constructor(tenantId: string) {
    super(`Nenhum PrintServer conectado para o tenant "${tenantId}".`);
    this.name = 'NoPrintServerConnectedError';
  }
}

/**
 * Wire protocol command sent to the PrintServer.
 *
 * IMPORTANT — protocol decision (Task 34):
 * The PrintServer desktop client (`OpenSea-PrintServer/src/main/ws-client.ts`)
 * currently validates incoming messages with a strict allow-list:
 * only `{ type: 'print', ... }` and `{ type: 'request-printers' }` are
 * accepted; anything else is silently dropped with a warning log.
 *
 * Since receipts are just ESC/POS byte streams (cuts, drawer kicks and
 * font width are encoded in the bytes themselves) we **reuse** the
 * existing `'print'` command verb instead of introducing a new
 * `'print-receipt'` verb. This keeps Phase 1 backend-only — no
 * PrintServer release is required to ship receipt printing.
 *
 * If the PrintServer ever needs to differentiate receipts from labels
 * (e.g. for telemetry or queue prioritization) a new verb can be added
 * in a coordinated PrintServer + backend release.
 */
export const PRINT_SERVER_COMMAND_TYPE = 'print' as const;

/**
 * Backend-side dispatcher that hands a rendered receipt to whichever
 * PrintServer (desktop print agent) is currently connected for the
 * tenant via `/v1/ws/print-agent`.
 *
 * The client is intentionally tiny: it
 *   1. allocates a fresh `jobId`
 *   2. base64-encodes the ESC/POS bytes
 *   3. delegates the actual send to {@link BroadcastToPrintServerFn}
 *
 * This keeps the unit-testable surface narrow and lets us mock the
 * WebSocket layer entirely.
 */
export class PrintServerReceiptClient {
  private readonly broadcast: BroadcastToPrintServerFn;

  constructor(broadcast: BroadcastToPrintServerFn = broadcastToPrintServer) {
    this.broadcast = broadcast;
  }

  async printReceipt(input: PrintReceiptInput): Promise<PrintReceiptOutput> {
    const jobId = randomBytes(16).toString('hex');
    const copies = input.copies ?? 1;

    const command = {
      type: PRINT_SERVER_COMMAND_TYPE,
      jobId,
      printerId: input.printerId,
      data: input.escposData.toString('base64'),
      copies,
    };

    const delivered = this.broadcast(input.tenantId, command);
    if (!delivered) {
      throw new NoPrintServerConnectedError(input.tenantId);
    }

    return { jobId };
  }
}
