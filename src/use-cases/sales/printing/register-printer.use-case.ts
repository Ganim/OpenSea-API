import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosPrinter,
  type PrinterConnection,
  type PrinterType,
} from '@/entities/sales/pos-printer';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';

export interface RegisterPrinterUseCaseRequest {
  tenantId: string;
  name: string;
  type: PrinterType;
  connection: PrinterConnection;
  ipAddress?: string;
  port?: number;
  deviceId?: string;
  bluetoothAddress?: string;
  paperWidth?: 80 | 58;
  isDefault?: boolean;
}

interface RegisterPrinterUseCaseResponse {
  printerId: string;
}

export interface PrinterConnectionValidator {
  validate(printer: PosPrinter): Promise<boolean>;
}

class DefaultPrinterConnectionValidator implements PrinterConnectionValidator {
  async validate(): Promise<boolean> {
    return true;
  }
}

export class RegisterPrinterUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private posPrintersRepository: PosPrintersRepository,
    private connectionValidator: PrinterConnectionValidator = new DefaultPrinterConnectionValidator(),
  ) {}

  async execute(
    input: RegisterPrinterUseCaseRequest,
  ): Promise<RegisterPrinterUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(input.tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found.');
    }

    this.validateConnectionConfiguration(input);

    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID(input.tenantId),
      name: input.name,
      type: input.type,
      connection: input.connection,
      ipAddress: input.ipAddress,
      port: input.port,
      deviceId: input.deviceId,
      bluetoothAddress: input.bluetoothAddress,
      paperWidth: input.paperWidth,
      isDefault: input.isDefault,
    });

    const isConnectionValid = await this.connectionValidator.validate(printer);

    if (!isConnectionValid) {
      throw new BadRequestError(
        'Unable to connect to printer with provided settings.',
      );
    }

    if (printer.isDefault) {
      await this.posPrintersRepository.unsetDefaultForTenant(input.tenantId);
    }

    await this.posPrintersRepository.create(printer);

    return { printerId: printer.id.toString() };
  }

  private validateConnectionConfiguration(
    input: RegisterPrinterUseCaseRequest,
  ) {
    if (input.connection === 'NETWORK' && !input.ipAddress) {
      throw new BadRequestError('Network printers require ipAddress.');
    }

    if (input.connection === 'USB' && !input.deviceId) {
      throw new BadRequestError('USB printers require deviceId.');
    }

    if (input.connection === 'BLUETOOTH' && !input.bluetoothAddress) {
      throw new BadRequestError('Bluetooth printers require bluetoothAddress.');
    }
  }
}
