import { describe, expect, it, vi } from 'vitest';

import {
  NoPrintServerConnectedError,
  PRINT_SERVER_COMMAND_TYPE,
  PrintServerReceiptClient,
  type BroadcastToPrintServerFn,
} from './print-server-receipt-client';

/**
 * Unit spec for {@link PrintServerReceiptClient}.
 *
 * The WebSocket broadcast is replaced with a `vi.fn()` so we exercise
 * only the client's command-shaping logic (jobId generation, base64
 * encoding, default copies, error mapping). The integration spec covers
 * the real WS round-trip.
 */

const TENANT_ID = 'tenant-merchant-001';
const PRINTER_ID = 'printer-bar-counter';

describe('PrintServerReceiptClient (unit)', () => {
  it('broadcasts a print command with jobId, base64 data, copies and tenantId', async () => {
    const broadcastSpy: ReturnType<
      typeof vi.fn<Parameters<BroadcastToPrintServerFn>, boolean>
    > = vi.fn().mockReturnValue(true);
    const client = new PrintServerReceiptClient(broadcastSpy);

    const escposPayload = Buffer.from('===RECEIPT-ESCPOS-BYTES===', 'utf8');
    const expectedBase64 = escposPayload.toString('base64');

    const { jobId } = await client.printReceipt({
      tenantId: TENANT_ID,
      printerId: PRINTER_ID,
      escposData: escposPayload,
      copies: 2,
    });

    expect(jobId).toMatch(/^[a-f0-9]{32}$/);
    expect(broadcastSpy).toHaveBeenCalledTimes(1);

    const [calledTenantId, calledCommand] = broadcastSpy.mock.calls[0];
    expect(calledTenantId).toBe(TENANT_ID);
    expect(calledCommand).toEqual({
      type: PRINT_SERVER_COMMAND_TYPE,
      jobId,
      printerId: PRINTER_ID,
      data: expectedBase64,
      copies: 2,
    });
  });

  it('defaults copies to 1 when omitted by the caller', async () => {
    const broadcastSpy = vi
      .fn<Parameters<BroadcastToPrintServerFn>, boolean>()
      .mockReturnValue(true);
    const client = new PrintServerReceiptClient(broadcastSpy);

    await client.printReceipt({
      tenantId: TENANT_ID,
      printerId: PRINTER_ID,
      escposData: Buffer.from('payload'),
    });

    const [, calledCommand] = broadcastSpy.mock.calls[0];
    expect((calledCommand as { copies: number }).copies).toBe(1);
  });

  it('generates a unique jobId for each call', async () => {
    const broadcastSpy = vi
      .fn<Parameters<BroadcastToPrintServerFn>, boolean>()
      .mockReturnValue(true);
    const client = new PrintServerReceiptClient(broadcastSpy);

    const firstResult = await client.printReceipt({
      tenantId: TENANT_ID,
      printerId: PRINTER_ID,
      escposData: Buffer.from('first'),
    });
    const secondResult = await client.printReceipt({
      tenantId: TENANT_ID,
      printerId: PRINTER_ID,
      escposData: Buffer.from('second'),
    });

    expect(firstResult.jobId).not.toBe(secondResult.jobId);
  });

  it('throws NoPrintServerConnectedError when broadcast returns false', async () => {
    const broadcastSpy = vi
      .fn<Parameters<BroadcastToPrintServerFn>, boolean>()
      .mockReturnValue(false);
    const client = new PrintServerReceiptClient(broadcastSpy);

    await expect(
      client.printReceipt({
        tenantId: 'tenant-without-printserver',
        printerId: PRINTER_ID,
        escposData: Buffer.from('payload'),
      }),
    ).rejects.toBeInstanceOf(NoPrintServerConnectedError);
  });

  it('encodes binary ESC/POS bytes as base64 (round-trip preserves bytes)', async () => {
    const broadcastSpy = vi
      .fn<Parameters<BroadcastToPrintServerFn>, boolean>()
      .mockReturnValue(true);
    const client = new PrintServerReceiptClient(broadcastSpy);

    // Mix of printable and non-printable ESC/POS bytes (ESC, GS, paper cut).
    const binaryPayload = Buffer.from([
      0x1b, 0x40, 0x1d, 0x56, 0x41, 0x10, 0x4f, 0x4b,
    ]);

    await client.printReceipt({
      tenantId: TENANT_ID,
      printerId: PRINTER_ID,
      escposData: binaryPayload,
    });

    const [, calledCommand] = broadcastSpy.mock.calls[0];
    const encoded = (calledCommand as { data: string }).data;
    const roundTrip = Buffer.from(encoded, 'base64');
    expect(roundTrip.equals(binaryPayload)).toBe(true);
  });
});
