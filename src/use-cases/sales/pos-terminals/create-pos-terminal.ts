import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosTerminal,
  type PosCashierMode,
  type PosTerminalMode,
} from '@/entities/sales/pos-terminal';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface CreatePosTerminalUseCaseRequest {
  tenantId: string;
  name: string;
  deviceId: string;
  mode: PosTerminalMode;
  cashierMode?: PosCashierMode;
  acceptsPendingOrders?: boolean;
  warehouseId: string;
  defaultPriceTableId?: string;
  settings?: Record<string, unknown>;
}

interface CreatePosTerminalUseCaseResponse {
  terminal: PosTerminal;
}

export class CreatePosTerminalUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: CreatePosTerminalUseCaseRequest,
  ): Promise<CreatePosTerminalUseCaseResponse> {
    const existing = await this.posTerminalsRepository.findByDeviceId(
      request.deviceId,
      request.tenantId,
    );

    if (existing) {
      throw new BadRequestError(
        'A terminal with this device ID already exists for this tenant.',
      );
    }

    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID(request.tenantId),
      name: request.name,
      deviceId: request.deviceId,
      mode: request.mode,
      cashierMode: request.cashierMode,
      acceptsPendingOrders: request.acceptsPendingOrders,
      warehouseId: new UniqueEntityID(request.warehouseId),
      defaultPriceTableId: request.defaultPriceTableId
        ? new UniqueEntityID(request.defaultPriceTableId)
        : undefined,
      settings: request.settings,
    });

    await this.posTerminalsRepository.create(terminal);

    return { terminal };
  }
}
