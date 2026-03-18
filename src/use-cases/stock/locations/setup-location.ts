import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  ZoneStructure,
  type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import { prisma, Prisma } from '@/lib/prisma';

export interface SetupLocationZoneInput {
  code: string;
  name: string;
  structure?: {
    aisleConfigs: Array<{
      shelvesPerAisle: number;
      binsPerShelf: number;
    }>;
  };
}

export interface SetupLocationRequest {
  tenantId: string;
  warehouse: {
    code: string;
    name: string;
    description?: string;
  };
  zones: SetupLocationZoneInput[];
}

export interface SetupLocationZoneResult {
  id: string;
  code: string;
  name: string;
  binCount: number;
}

export interface SetupLocationResponse {
  warehouse: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
  zones: SetupLocationZoneResult[];
  totalBinsCreated: number;
}

export class SetupLocationUseCase {
  async execute(request: SetupLocationRequest): Promise<SetupLocationResponse> {
    const { tenantId, warehouse: warehouseInput, zones: zoneInputs } = request;

    const warehouseCode = warehouseInput.code.toUpperCase();

    // Validate warehouse code uniqueness
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: {
        tenantId,
        code: warehouseCode,
        deletedAt: null,
      },
    });

    if (existingWarehouse) {
      throw new BadRequestError(
        `A warehouse with code "${warehouseCode}" already exists.`,
      );
    }

    // Validate zone codes uniqueness among themselves
    const zoneCodes = zoneInputs.map((zone) => zone.code.toUpperCase());
    const uniqueZoneCodes = new Set(zoneCodes);

    if (uniqueZoneCodes.size !== zoneCodes.length) {
      throw new BadRequestError(
        'Zone codes must be unique within the setup request.',
      );
    }

    // Execute entire setup in a single transaction
    return prisma.$transaction(
      async (tx) => {
        // Create warehouse
        const createdWarehouse = await tx.warehouse.create({
          data: {
            tenantId,
            code: warehouseCode,
            name: warehouseInput.name,
            description: warehouseInput.description ?? null,
            isActive: true,
          },
        });

        const zoneResults: SetupLocationZoneResult[] = [];
        let totalBinsCreated = 0;

        for (const zoneInput of zoneInputs) {
          const zoneCode = zoneInput.code.toUpperCase();

          // Build structure props if aisleConfigs are provided
          let structureProps: ZoneStructureProps = {
            aisles: 0,
            shelvesPerAisle: 0,
            binsPerShelf: 0,
          };

          if (zoneInput.structure?.aisleConfigs?.length) {
            const aisleConfigs = zoneInput.structure.aisleConfigs.map(
              (config, index) => ({
                aisleNumber: index + 1,
                shelvesCount: config.shelvesPerAisle,
                binsPerShelf: config.binsPerShelf,
              }),
            );

            structureProps = {
              aisles: aisleConfigs.length,
              shelvesPerAisle: Math.max(
                ...aisleConfigs.map((c) => c.shelvesCount),
              ),
              binsPerShelf: Math.max(
                ...aisleConfigs.map((c) => c.binsPerShelf),
              ),
              aisleConfigs,
            };
          }

          const zoneStructure = ZoneStructure.create(structureProps);

          // Create zone
          const createdZone = await tx.zone.create({
            data: {
              tenantId,
              warehouseId: createdWarehouse.id,
              code: zoneCode,
              name: zoneInput.name,
              structure:
                zoneStructure.toJSON() as unknown as Prisma.InputJsonValue,
              isActive: true,
            },
          });

          // Generate and create bins if structure has content
          let binCount = 0;

          if (zoneStructure.totalBins > 0) {
            if (zoneStructure.totalBins > 10000) {
              throw new BadRequestError(
                `Zone "${zoneCode}" would create ${zoneStructure.totalBins} bins. Maximum is 10,000 bins per zone.`,
              );
            }

            const binData = zoneStructure.generateBinData(
              warehouseCode,
              zoneCode,
            );

            await tx.bin.createMany({
              data: binData.map((bin) => ({
                tenantId,
                zoneId: createdZone.id,
                address: bin.address,
                aisle: bin.aisle,
                shelf: bin.shelf,
                position: bin.position,
                currentOccupancy: 0,
                isActive: true,
                isBlocked: false,
              })),
            });

            binCount = binData.length;
            totalBinsCreated += binCount;
          }

          zoneResults.push({
            id: createdZone.id,
            code: createdZone.code,
            name: createdZone.name,
            binCount,
          });
        }

        return {
          warehouse: {
            id: createdWarehouse.id,
            code: createdWarehouse.code,
            name: createdWarehouse.name,
            description: createdWarehouse.description,
          },
          zones: zoneResults,
          totalBinsCreated,
        };
      },
      {
        timeout: 30_000,
      },
    );
  }
}
