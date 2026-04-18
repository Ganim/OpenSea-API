import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';

export interface DeletePunchDeviceRequest {
  tenantId: string;
  deviceId: string;
}

/**
 * Soft-delete de PunchDevice. A entrada no banco permanece com `deletedAt`
 * preenchido — essencial para auditoria Portaria 671 (a relação com
 * TimeEntry via nsr não pode ser quebrada).
 *
 * Após delete: list/get retornam 404; middleware `verifyPunchDeviceToken`
 * rejeita requisições do token antigo.
 */
export class DeletePunchDeviceUseCase {
  constructor(private punchDevicesRepository: PunchDevicesRepository) {}

  async execute(input: DeletePunchDeviceRequest): Promise<void> {
    const device = await this.punchDevicesRepository.findById(
      new UniqueEntityID(input.deviceId),
      input.tenantId,
    );

    if (!device) {
      throw new ResourceNotFoundError('Dispositivo de ponto não encontrado');
    }

    await this.punchDevicesRepository.delete(
      new UniqueEntityID(input.deviceId),
      input.tenantId,
    );
  }
}
