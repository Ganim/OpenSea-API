import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import type { LabelData } from './generate-labels';

interface GenerateLabelsByZoneUseCaseRequest {
  zoneId: string;
  format: 'qr' | 'barcode';
  size: 'small' | 'medium' | 'large';
  aisles?: number[];
  shelvesFrom?: number;
  shelvesTo?: number;
  positions?: string[];
  includeWarehouse?: boolean;
  includeZone?: boolean;
}

interface GenerateLabelsByZoneUseCaseResponse {
  labels: LabelData[];
  format: 'qr' | 'barcode';
  size: 'small' | 'medium' | 'large';
  totalLabels: number;
}

export class GenerateLabelsByZoneUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute(
    input: GenerateLabelsByZoneUseCaseRequest,
  ): Promise<GenerateLabelsByZoneUseCaseResponse> {
    const {
      zoneId,
      format,
      size,
      aisles,
      shelvesFrom,
      shelvesTo,
      positions,
      includeWarehouse = true,
      includeZone = true,
    } = input;

    // Fetch the zone
    const zone = await this.zonesRepository.findById(
      new UniqueEntityID(zoneId),
    );

    if (!zone) {
      throw new ResourceNotFoundError('Zona não encontrada');
    }

    // Fetch the warehouse
    const warehouse = await this.warehousesRepository.findById(
      zone.warehouseId,
    );

    if (!warehouse) {
      throw new ResourceNotFoundError('Armazém não encontrado');
    }

    // Fetch all bins for the zone
    let bins = await this.binsRepository.findManyByZone(
      new UniqueEntityID(zoneId),
    );

    // Apply filters
    bins = this.applyFilters(bins, {
      aisles,
      shelvesFrom,
      shelvesTo,
      positions,
    });

    const labels: LabelData[] = bins.map((bin) => {
      let codeData = bin.address;

      if (!includeWarehouse && !includeZone) {
        const parts = bin.address.split('-');
        codeData = parts.slice(2).join('-');
      } else if (!includeWarehouse) {
        const parts = bin.address.split('-');
        codeData = parts.slice(1).join('-');
      }

      return {
        binId: bin.binId.toString(),
        address: bin.address,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        zoneCode: zone.code,
        zoneName: zone.name,
        aisle: bin.aisle,
        shelf: bin.shelf,
        position: bin.position,
        codeData,
      };
    });

    return {
      labels,
      format,
      size,
      totalLabels: labels.length,
    };
  }

  private applyFilters(
    bins: Bin[],
    filters: {
      aisles?: number[];
      shelvesFrom?: number;
      shelvesTo?: number;
      positions?: string[];
    },
  ): Bin[] {
    let filtered = bins;

    if (filters.aisles && filters.aisles.length > 0) {
      filtered = filtered.filter((bin) => filters.aisles!.includes(bin.aisle));
    }

    if (filters.shelvesFrom !== undefined) {
      filtered = filtered.filter((bin) => bin.shelf >= filters.shelvesFrom!);
    }

    if (filters.shelvesTo !== undefined) {
      filtered = filtered.filter((bin) => bin.shelf <= filters.shelvesTo!);
    }

    if (filters.positions && filters.positions.length > 0) {
      const upperPositions = filters.positions.map((p) => p.toUpperCase());
      filtered = filtered.filter((bin) =>
        upperPositions.includes(bin.position.toUpperCase()),
      );
    }

    return filtered;
  }
}
