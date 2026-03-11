import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { Volume } from '@/entities/stock/volume';
import type { VolumeDTO } from '@/mappers/stock/volume/volume-to-dto';
import { volumeToDTO } from '@/mappers/stock/volume/volume-to-dto';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface CreateVolumeUseCaseRequest {
  tenantId: string;
  name?: string;
  notes?: string;
  destinationRef?: string;
  salesOrderId?: string;
  customerId?: string;
  createdBy: string;
  status?: VolumeStatus;
}

export interface CreateVolumeUseCaseResponse {
  volume: VolumeDTO;
}

export class CreateVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  /**
   * Gera código único para o volume no formato VOL-YYYY-NNNNNN
   */
  private generateVolumeCode(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `VOL-${year}-${timestamp}${random}`;
  }

  async execute(
    request: CreateVolumeUseCaseRequest,
  ): Promise<CreateVolumeUseCaseResponse> {
    // Gerar código único
    let code = this.generateVolumeCode();

    // Garantir que o código é único (tentativa de retry)
    let existingVolume = await this.volumesRepository.findByCode(
      code,
      request.tenantId,
    );
    let attempts = 0;
    while (existingVolume && attempts < 5) {
      code = this.generateVolumeCode();
      existingVolume = await this.volumesRepository.findByCode(
        code,
        request.tenantId,
      );
      attempts++;
    }

    if (existingVolume) {
      throw new BadRequestError(
        'Unable to generate a unique code for the volume',
      );
    }

    // Validar status se fornecido
    const status = request.status ?? VolumeStatus.OPEN;
    if (!Object.values(VolumeStatus).includes(status)) {
      throw new BadRequestError(`Invalid status: ${status}`);
    }

    // Criar novo volume
    const volume = Volume.create({
      tenantId: new UniqueEntityID(request.tenantId),
      code,
      name: request.name,
      status,
      notes: request.notes,
      destinationRef: request.destinationRef,
      salesOrderId: request.salesOrderId,
      customerId: request.customerId,
      createdBy: request.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.volumesRepository.create(volume);

    const volumeDTO = volumeToDTO(volume);

    return {
      volume: volumeDTO,
    };
  }
}
