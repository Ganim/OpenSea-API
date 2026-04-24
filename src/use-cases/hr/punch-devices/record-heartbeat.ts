/**
 * RecordHeartbeatUseCase — Phase 07 / Plan 07-05b (Wave 3).
 *
 * Atualiza `PunchDevice.lastSeenAt` + `status='ONLINE'` ao receber heartbeat
 * do kiosk. D-13 RESOLVED: reusamos o campo existente `lastSeenAt` em vez de
 * criar `lastHeartbeatAt` separado (decisão final em RESEARCH §3 + PATTERNS
 * linha 1426).
 *
 * Idempotência: chamadas repetidas só atualizam timestamp + status. Se o
 * device estava ONLINE → fields são re-escritos (no-op semântico). Se estava
 * OFFLINE/ERROR → transição para ONLINE registrada na resposta para o
 * controller emitir Socket.IO event downstream.
 *
 * Trust boundary (T-7-05b-02): use case NÃO valida posse do token — isso
 * é responsabilidade do middleware `verifyPunchDeviceToken` (faz hash +
 * lookup + revogação check ANTES de chegar no controller). Aqui apenas
 * confirmamos `tenantId + deviceId` casam.
 */

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

export interface HeartbeatPrisma {
  punchDevice: {
    findFirst(args: {
      where: { id: string; tenantId: string };
      select: { id: true; status: true };
    }): Promise<{ id: string; status: string } | null>;
    update(args: {
      where: { id: string };
      data: { lastSeenAt: Date; status: string };
    }): Promise<unknown>;
  };
}

export interface RecordHeartbeatInput {
  tenantId: string;
  deviceId: string;
  /** Override "now" — used by tests for determinism. */
  now?: Date;
}

export interface RecordHeartbeatResponse {
  /** True quando o status anterior NÃO era ONLINE — controller emite event. */
  transitionedToOnline: boolean;
  recordedAt: Date;
}

export class RecordHeartbeatUseCase {
  constructor(private prisma: HeartbeatPrisma) {}

  async execute(input: RecordHeartbeatInput): Promise<RecordHeartbeatResponse> {
    const now = input.now ?? new Date();
    const existing = await this.prisma.punchDevice.findFirst({
      where: { id: input.deviceId, tenantId: input.tenantId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new ResourceNotFoundError('Device não encontrado');
    }

    await this.prisma.punchDevice.update({
      where: { id: input.deviceId },
      data: { lastSeenAt: now, status: 'ONLINE' },
    });

    return {
      transitionedToOnline: existing.status !== 'ONLINE',
      recordedAt: now,
    };
  }
}
