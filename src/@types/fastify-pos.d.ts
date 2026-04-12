import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PosTerminal } from '@/entities/sales/pos-terminal';

declare module 'fastify' {
  interface FastifyRequest {
    terminal?: PosTerminal;
    devicePairing?: PosDevicePairing;
    currentSession?: PosSession | null;
  }
}
