import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAddress } from '@/entities/hr/company-address';
import { prisma } from '@/lib/prisma';
import { mapCompanyAddressPrismaToDomain } from '@/mappers/hr/company-address';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CompanyAddressesRepository,
  CreateCompanyAddressSchema,
  FindManyCompanyAddressesParams,
  FindManyCompanyAddressesResult,
} from '../company-addresses-repository';

export class PrismaCompanyAddressesRepository
  implements CompanyAddressesRepository
{
  async create(data: CreateCompanyAddressSchema): Promise<CompanyAddress> {
    const created = await prisma.companyAddress.create({
      data: {
        companyId: data.companyId.toString(),
        type: data.type ?? 'OTHER',
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
        zip: data.zip,
        ibgeCityCode: data.ibgeCityCode,
        countryCode: data.countryCode ?? 'BR',
        isPrimary: data.isPrimary ?? false,
        pendingIssues: data.pendingIssues ?? [],
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return CompanyAddress.create(
      mapCompanyAddressPrismaToDomain(created),
      new UniqueEntityID(created.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyAddress | null> {
    const address = await prisma.companyAddress.findFirst({
      where: {
        id: id.toString(),
        ...(options?.companyId
          ? { companyId: options.companyId.toString() }
          : {}),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!address) return null;

    return CompanyAddress.create(
      mapCompanyAddressPrismaToDomain(address),
      new UniqueEntityID(address.id),
    );
  }

  async findByCompanyAndType(
    companyId: UniqueEntityID,
    type: 'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER',
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyAddress | null> {
    const address = await prisma.companyAddress.findFirst({
      where: {
        companyId: companyId.toString(),
        type,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!address) return null;

    return CompanyAddress.create(
      mapCompanyAddressPrismaToDomain(address),
      new UniqueEntityID(address.id),
    );
  }

  async findPrimaryByType(
    companyId: UniqueEntityID,
    type: 'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER',
  ): Promise<CompanyAddress | null> {
    const address = await prisma.companyAddress.findFirst({
      where: {
        companyId: companyId.toString(),
        type,
        isPrimary: true,
        deletedAt: null,
      },
    });

    if (!address) return null;

    return CompanyAddress.create(
      mapCompanyAddressPrismaToDomain(address),
      new UniqueEntityID(address.id),
    );
  }

  async findMany(
    params: FindManyCompanyAddressesParams,
  ): Promise<FindManyCompanyAddressesResult> {
    const {
      companyId,
      type,
      isPrimary,
      includeDeleted = false,
      page = 1,
      perPage = 20,
    } = params;

    const where = {
      companyId: companyId.toString(),
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(type ? { type } : {}),
      ...(isPrimary !== undefined ? { isPrimary } : {}),
    };

    const [addresses, total] = await Promise.all([
      prisma.companyAddress.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyAddress.count({ where }),
    ]);

    return {
      addresses: addresses.map((address) =>
        CompanyAddress.create(
          mapCompanyAddressPrismaToDomain(address),
          new UniqueEntityID(address.id),
        ),
      ),
      total,
    };
  }

  async save(address: CompanyAddress): Promise<void> {
    await prisma.companyAddress.update({
      where: { id: address.id.toString() },
      data: {
        companyId: address.companyId.toString(),
        type: address.type,
        street: address.street,
        number: address.number,
        complement: address.complement,
        district: address.district,
        city: address.city,
        state: address.state,
        zip: address.zip,
        ibgeCityCode: address.ibgeCityCode,
        countryCode: address.countryCode,
        isPrimary: address.isPrimary,
        pendingIssues: address.pendingIssues,
        metadata: address.metadata as Prisma.InputJsonValue,
        deletedAt: address.deletedAt ?? null,
        updatedAt: address.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.companyAddress.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async unsetPrimaryForType(
    companyId: UniqueEntityID,
    type: 'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER',
    exceptId?: UniqueEntityID,
  ): Promise<void> {
    await prisma.companyAddress.updateMany({
      where: {
        companyId: companyId.toString(),
        type,
        deletedAt: null,
        ...(exceptId ? { id: { not: exceptId.toString() } } : {}),
      },
      data: {
        isPrimary: false,
      },
    });
  }
}
