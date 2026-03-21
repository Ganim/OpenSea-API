import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  PosCashierMode,
  PosTerminal,
  PosTerminalMode,
} from '@/entities/sales/pos-terminal';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface UpdatePosTerminalUseCaseRequest {
  tenantId: string;
  terminalId: string;
  name?: string;
  deviceId?: string;
  mode?: PosTerminalMode;
  cashierMode?: PosCashierMode;
  acceptsPendingOrders?: boolean;
  warehouseId?: string;
  defaultPriceTableId?: string | null;
  isActive?: boolean;
  settings?: Record<string, unknown> | null;
}

interface UpdatePosTerminalUseCaseResponse {
  terminal: PosTerminal;
}

export class UpdatePosTerminalUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: UpdatePosTerminalUseCaseRequest,
  ): Promise<UpdatePosTerminalUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    if (request.name !== undefined) terminal.name = request.name;
    if (request.deviceId !== undefined) terminal.deviceId = request.deviceId;
    if (request.mode !== undefined) terminal.mode = request.mode;
    if (request.cashierMode !== undefined)
      terminal.cashierMode = request.cashierMode;
    if (request.acceptsPendingOrders !== undefined)
      terminal.acceptsPendingOrders = request.acceptsPendingOrders;
    if (request.warehouseId !== undefined)
      terminal.warehouseId = new UniqueEntityID(request.warehouseId);
    if (request.defaultPriceTableId !== undefined) {
      terminal.defaultPriceTableId = request.defaultPriceTableId
        ? new UniqueEntityID(request.defaultPriceTableId)
        : undefined;
    }
    if (request.isActive !== undefined) terminal.isActive = request.isActive;
    if (request.settings !== undefined) {
      terminal.settings = request.settings ?? undefined;
    }

    await this.posTerminalsRepository.save(terminal);

    return { terminal };
  }
}
