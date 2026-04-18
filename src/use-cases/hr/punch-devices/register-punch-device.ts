import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice, type PunchDeviceKind } from '@/entities/hr/punch-device';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';

export interface RegisterPunchDeviceRequest {
  tenantId: string;
  name: string;
  deviceKind: PunchDeviceKind;
  geofenceZoneId?: string;
  allowedEmployeeIds?: string[];
  allowedDepartmentIds?: string[];
}

export interface RegisterPunchDeviceResponse {
  deviceId: string;
  /**
   * pairingSecret é retornado UMA vez e nunca mais. O admin deve armazená-lo
   * imediatamente — todas as leituras subsequentes (list/get) são redigidas
   * pelo mapper DTO (Pitfall 5 / T-04-01).
   */
  pairingSecret: string;
}

const VALID_KINDS: PunchDeviceKind[] = [
  'PWA_PERSONAL',
  'KIOSK_PUBLIC',
  'BIOMETRIC_READER',
  'WEBAUTHN_PC',
];

/**
 * Cria um PunchDevice + allowlist atomicamente.
 * - Valida name + deviceKind (Zod também valida no controller, mas o use
 *   case é chamado por testes unitários sem passar pelo Zod)
 * - Gera pairingSecret de 32 bytes hex (via PunchDevice.create default)
 * - Persiste via createWithAllowlist em transação Prisma
 *
 * Purpose: PUNCH-CORE-01 (admin cadastra dispositivos) + PUNCH-CORE-02
 * (vincula geofence + allowlist na criação).
 */
export class RegisterPunchDeviceUseCase {
  constructor(private punchDevicesRepository: PunchDevicesRepository) {}

  async execute(
    input: RegisterPunchDeviceRequest,
  ): Promise<RegisterPunchDeviceResponse> {
    const name = input.name?.trim();
    if (!name || name.length < 1) {
      throw new BadRequestError('Nome do dispositivo é obrigatório');
    }
    if (name.length > 128) {
      throw new BadRequestError(
        'Nome do dispositivo deve ter no máximo 128 caracteres',
      );
    }
    if (!VALID_KINDS.includes(input.deviceKind)) {
      throw new BadRequestError('deviceKind inválido');
    }

    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(input.tenantId),
      name,
      deviceKind: input.deviceKind,
      geofenceZoneId: input.geofenceZoneId
        ? new UniqueEntityID(input.geofenceZoneId)
        : undefined,
    });

    await this.punchDevicesRepository.createWithAllowlist({
      device,
      allowedEmployeeIds: input.allowedEmployeeIds,
      allowedDepartmentIds: input.allowedDepartmentIds,
    });

    return {
      deviceId: device.id.toString(),
      pairingSecret: device.pairingSecret,
    };
  }
}
