import type { Supplier } from '@/entities/hr/organization/supplier';
import { prisma } from '@/lib/prisma';
import {
  mapSupplierOrganizationPrismaToDomain,
  mapSupplierOrganizationDomainToPrisma,
} from '@/mappers/hr/organization';
import type {
  CreateSupplierSchema,
  SuppliersRepository,
  UpdateSupplierSchema,
} from '../suppliers-repository';
import { PrismaBaseOrganizationRepository } from './prisma-base-organization-repository';

export class PrismaSuppliersRepository
  extends PrismaBaseOrganizationRepository<Supplier>
  implements SuppliersRepository
{
  protected readonly organizationType = 'SUPPLIER' as const;

  protected toDomain(data: Record<string, unknown>): Supplier {
    return mapSupplierOrganizationPrismaToDomain(data);
  }

  protected fromDomain(supplier: Supplier): Record<string, unknown> {
    return mapSupplierOrganizationDomainToPrisma(supplier);
  }

  async create(data: CreateSupplierSchema): Promise<Supplier> {
    // Get next sequential code
    const lastSupplier = await prisma.organization.findFirst({
      where: { type: 'SUPPLIER' },
      orderBy: { createdAt: 'desc' },
      select: { typeSpecificData: true },
    });

    const lastSequentialCode =
      (lastSupplier?.typeSpecificData as Record<string, unknown>)
        ?.sequentialCode ?? 0;
    const sequentialCode = (lastSequentialCode as number) + 1;

    // Build typeSpecificData
    const typeSpecificData = {
      paymentTerms: data.paymentTerms ?? null,
      rating: data.rating ?? null,
      isPreferredSupplier: data.isPreferredSupplier ?? false,
      contractNumber: data.contractNumber ?? null,
      contractStartDate: data.contractStartDate ?? null,
      contractEndDate: data.contractEndDate ?? null,
      leadTime: data.leadTime ?? null,
      minimumOrderValue: data.minimumOrderValue ?? null,
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

  async update(data: UpdateSupplierSchema): Promise<Supplier | null> {
    // Build updated typeSpecificData
    const updatedTypeSpecificData: Record<string, unknown> = {};

    if (data.paymentTerms !== undefined)
      updatedTypeSpecificData.paymentTerms = data.paymentTerms;
    if (data.rating !== undefined) updatedTypeSpecificData.rating = data.rating;
    if (data.isPreferredSupplier !== undefined)
      updatedTypeSpecificData.isPreferredSupplier = data.isPreferredSupplier;
    if (data.contractNumber !== undefined)
      updatedTypeSpecificData.contractNumber = data.contractNumber;
    if (data.contractStartDate !== undefined)
      updatedTypeSpecificData.contractStartDate = data.contractStartDate;
    if (data.contractEndDate !== undefined)
      updatedTypeSpecificData.contractEndDate = data.contractEndDate;
    if (data.leadTime !== undefined)
      updatedTypeSpecificData.leadTime = data.leadTime;
    if (data.minimumOrderValue !== undefined)
      updatedTypeSpecificData.minimumOrderValue = data.minimumOrderValue;
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

  async findBySequentialCode(code: number): Promise<Supplier | null> {
    const supplier = await prisma.organization.findFirst({
      where: {
        type: 'SUPPLIER',
        typeSpecificData: {
          path: ['sequentialCode'],
          equals: code,
        },
        deletedAt: null,
      },
    });

    if (!supplier) return null;

    return this.toDomain(supplier);
  }

  async findPreferredSuppliers(): Promise<Supplier[]> {
    const suppliers = await prisma.organization.findMany({
      where: {
        type: 'SUPPLIER',
        typeSpecificData: {
          path: ['isPreferredSupplier'],
          equals: true,
        },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return suppliers.map((data) => this.toDomain(data));
  }

  async findByRatingRange(min: number, max: number): Promise<Supplier[]> {
    const suppliers = await prisma.organization.findMany({
      where: {
        type: 'SUPPLIER',
        AND: [
          {
            typeSpecificData: {
              path: ['rating'],
              gte: min,
            },
          },
          {
            typeSpecificData: {
              path: ['rating'],
              lte: max,
            },
          },
        ],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return suppliers.map((data) => this.toDomain(data));
  }
}
