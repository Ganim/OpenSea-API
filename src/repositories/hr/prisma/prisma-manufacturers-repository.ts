import type { Manufacturer } from '@/entities/hr/organization/manufacturer';
import { prisma } from '@/lib/prisma';
import {
  mapManufacturerOrganizationPrismaToDomain,
  mapManufacturerOrganizationDomainToPrisma,
} from '@/mappers/hr/organization';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
  UpdateManufacturerSchema,
} from '../manufacturers-repository';
import { PrismaBaseOrganizationRepository } from './prisma-base-organization-repository';

export class PrismaManufacturersRepository
  extends PrismaBaseOrganizationRepository<Manufacturer>
  implements ManufacturersRepository
{
  protected readonly organizationType = 'MANUFACTURER' as const;

  protected toDomain(data: Record<string, unknown>): Manufacturer {
    return mapManufacturerOrganizationPrismaToDomain(data);
  }

  protected fromDomain(manufacturer: Manufacturer): Record<string, unknown> {
    return mapManufacturerOrganizationDomainToPrisma(manufacturer);
  }

  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    // Get next sequential code
    const lastManufacturer = await prisma.organization.findFirst({
      where: { type: 'MANUFACTURER' },
      orderBy: { createdAt: 'desc' },
      select: { typeSpecificData: true },
    });

    const lastSequentialCode =
      (lastManufacturer?.typeSpecificData as Record<string, unknown>)
        ?.sequentialCode ?? 0;
    const sequentialCode = (lastSequentialCode as number) + 1;

    // Build typeSpecificData
    const typeSpecificData = {
      productionCapacity: data.productionCapacity ?? null,
      leadTime: data.leadTime ?? null,
      certifications: data.certifications ?? [],
      qualityRating: data.qualityRating ?? null,
      defectRate: data.defectRate ?? null,
      minimumOrderQuantity: data.minimumOrderQuantity ?? null,
      paymentTerms: data.paymentTerms ?? null,
      countryOfOrigin: data.countryOfOrigin ?? null,
      factoryLocation: data.factoryLocation ?? null,
      sequentialCode,
      externalId: data.externalId ?? null,
      notes: data.notes ?? null,
      ...(data.typeSpecificData ?? {}),
    };

    const createSchema = {
      ...data,
      typeSpecificData,
    };

    return super.create(createSchema);
  }

  async update(data: UpdateManufacturerSchema): Promise<Manufacturer | null> {
    // Build updated typeSpecificData
    const updatedTypeSpecificData: Record<string, unknown> = {};

    if (data.productionCapacity !== undefined)
      updatedTypeSpecificData.productionCapacity = data.productionCapacity;
    if (data.leadTime !== undefined)
      updatedTypeSpecificData.leadTime = data.leadTime;
    if (data.certifications !== undefined)
      updatedTypeSpecificData.certifications = data.certifications;
    if (data.qualityRating !== undefined)
      updatedTypeSpecificData.qualityRating = data.qualityRating;
    if (data.defectRate !== undefined)
      updatedTypeSpecificData.defectRate = data.defectRate;
    if (data.minimumOrderQuantity !== undefined)
      updatedTypeSpecificData.minimumOrderQuantity = data.minimumOrderQuantity;
    if (data.paymentTerms !== undefined)
      updatedTypeSpecificData.paymentTerms = data.paymentTerms;
    if (data.countryOfOrigin !== undefined)
      updatedTypeSpecificData.countryOfOrigin = data.countryOfOrigin;
    if (data.factoryLocation !== undefined)
      updatedTypeSpecificData.factoryLocation = data.factoryLocation;
    if (data.externalId !== undefined)
      updatedTypeSpecificData.externalId = data.externalId;
    if (data.notes !== undefined) updatedTypeSpecificData.notes = data.notes;

    const updateSchema = {
      ...data,
      typeSpecificData: {
        ...data.typeSpecificData,
        ...updatedTypeSpecificData,
      },
    };

    return super.update(updateSchema);
  }

  async findBySequentialCode(code: number): Promise<Manufacturer | null> {
    const manufacturer = await prisma.organization.findFirst({
      where: {
        type: 'MANUFACTURER',
        typeSpecificData: {
          path: ['sequentialCode'],
          equals: code,
        },
        deletedAt: null,
      },
    });

    if (!manufacturer) return null;

    return this.toDomain(manufacturer);
  }

  async findByCountry(country: string): Promise<Manufacturer[]> {
    const manufacturers = await prisma.organization.findMany({
      where: {
        type: 'MANUFACTURER',
        typeSpecificData: {
          path: ['countryOfOrigin'],
          equals: country,
        },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return manufacturers.map((data) => this.toDomain(data));
  }

  async findByCertification(certification: string): Promise<Manufacturer[]> {
    const manufacturers = await prisma.organization.findMany({
      where: {
        type: 'MANUFACTURER',
        typeSpecificData: {
          path: ['certifications'],
          array_contains: certification,
        },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return manufacturers.map((data) => this.toDomain(data));
  }

  async findByQualityRatingRange(
    min: number,
    max: number,
  ): Promise<Manufacturer[]> {
    const manufacturers = await prisma.organization.findMany({
      where: {
        type: 'MANUFACTURER',
        AND: [
          {
            typeSpecificData: {
              path: ['qualityRating'],
              gte: min,
            },
          },
          {
            typeSpecificData: {
              path: ['qualityRating'],
              lte: max,
            },
          },
        ],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return manufacturers.map((data) => this.toDomain(data));
  }
}
