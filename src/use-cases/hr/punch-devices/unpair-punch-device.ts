import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';

export interface UnpairPunchDeviceRequest {
  tenantId: string;
  deviceId: string;
  revokedByUserId: string;
  reason?: string;
}

/**
 * Revoga um PunchDevice. Após esta chamada, `findByDeviceTokenHash`
 * retorna `null` e qualquer requisição subsequente com aquele token
 * falha em `verifyPunchDeviceToken` (Plan 3). Propagação < 5s conforme
 * PUNCH-CORE-08.
 *
 * Idempotente: chamar em um device já revogado NÃO lança erro — apenas
 * atualiza `revokedAt/revokedByUserId/revokedReason` para o chamador
 * atual (útil para atualizar reason após investigação).
 */
export class UnpairPunchDeviceUseCase {
  constructor(private punchDevicesRepository: PunchDevicesRepository) {}

  async execute(input: UnpairPunchDeviceRequest): Promise<void> {
    const device = await this.punchDevicesRepository.findById(
      new UniqueEntityID(input.deviceId),
      input.tenantId,
    );

    if (!device) {
      throw new ResourceNotFoundError('Dispositivo de ponto não encontrado');
    }

    device.revoke(input.revokedByUserId, input.reason);
    await this.punchDevicesRepository.save(device);
  }
}
