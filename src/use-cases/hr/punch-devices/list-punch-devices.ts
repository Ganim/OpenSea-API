import type {
  PunchDeviceKind,
  PunchDeviceStatus,
} from '@/entities/hr/punch-device';
import {
  type PunchDeviceDTO,
  punchDeviceToDTO,
} from '@/mappers/hr/punch-device/punch-device-to-dto';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';

export interface ListPunchDevicesRequest {
  tenantId: string;
  deviceKind?: PunchDeviceKind;
  status?: PunchDeviceStatus;
  includeRevoked?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListPunchDevicesResponse {
  items: PunchDeviceDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lista paginada de PunchDevices do tenant. Usa o `punchDeviceToDTO` mapper
 * para garantir que `pairingSecret` e `deviceTokenHash` nunca aparecem
 * na resposta (T-04-01 / Pitfall 5).
 */
export class ListPunchDevicesUseCase {
  constructor(private punchDevicesRepository: PunchDevicesRepository) {}

  async execute(
    input: ListPunchDevicesRequest,
  ): Promise<ListPunchDevicesResponse> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;

    const { items, total } =
      await this.punchDevicesRepository.findManyByTenantId(input.tenantId, {
        deviceKind: input.deviceKind,
        status: input.status,
        includeRevoked: input.includeRevoked,
        page,
        pageSize,
      });

    return {
      items: items.map(punchDeviceToDTO),
      total,
      page,
      pageSize,
    };
  }
}
