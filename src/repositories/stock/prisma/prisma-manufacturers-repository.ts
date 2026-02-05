import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/stock/manufacturer';
import { prisma } from '@/lib/prisma';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
  UpdateManufacturerSchema,
} from '../manufacturers-repository';

export class PrismaManufacturersRepository implements ManufacturersRepository {
  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    const manufacturerData = await prisma.manufacturer.create({
      data: {
        tenantId: data.tenantId,
        code: data.code, // Codigo hierarquico auto-gerado
        name: data.name,
        legalName: data.legalName,
        cnpj: data.cnpj,
        country: data.country,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.addressLine1,
        city: data.city,
        state: data.state,
        zipCode: data.postalCode,
        isActive: data.isActive ?? true,
        rating: data.rating ? data.rating : undefined,
        notes: data.notes,
      },
    });

    return Manufacturer.create(
      {
        tenantId: new EntityID(manufacturerData.tenantId),
        code: manufacturerData.code,
        sequentialCode: manufacturerData.sequentialCode,
        name: manufacturerData.name,
        legalName: manufacturerData.legalName,
        cnpj: manufacturerData.cnpj,
        country: manufacturerData.country ?? '',
        email: manufacturerData.email,
        phone: manufacturerData.phone,
        website: manufacturerData.website,
        addressLine1: manufacturerData.address,
        addressLine2: null,
        city: manufacturerData.city,
        state: manufacturerData.state,
        postalCode: manufacturerData.zipCode,
        isActive: manufacturerData.isActive,
        rating: manufacturerData.rating
          ? Number(manufacturerData.rating.toString())
          : null,
        notes: manufacturerData.notes,
        createdAt: manufacturerData.createdAt,
        updatedAt: manufacturerData.updatedAt,
      },
      new EntityID(manufacturerData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Manufacturer | null> {
    const manufacturerData = await prisma.manufacturer.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!manufacturerData) {
      return null;
    }

    return Manufacturer.create(
      {
        tenantId: new EntityID(manufacturerData.tenantId),
        code: manufacturerData.code,
        sequentialCode: manufacturerData.sequentialCode,
        name: manufacturerData.name,
        legalName: manufacturerData.legalName,
        cnpj: manufacturerData.cnpj,
        country: manufacturerData.country ?? '',
        email: manufacturerData.email,
        phone: manufacturerData.phone,
        website: manufacturerData.website,
        addressLine1: manufacturerData.address,
        addressLine2: null,
        city: manufacturerData.city,
        state: manufacturerData.state,
        postalCode: manufacturerData.zipCode,
        isActive: manufacturerData.isActive,
        rating: manufacturerData.rating
          ? Number(manufacturerData.rating.toString())
          : null,
        notes: manufacturerData.notes,
        createdAt: manufacturerData.createdAt,
        updatedAt: manufacturerData.updatedAt,
      },
      new EntityID(manufacturerData.id),
    );
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<Manufacturer | null> {
    const manufacturerData = await prisma.manufacturer.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        tenantId,
        deletedAt: null,
      },
    });

    if (!manufacturerData) {
      return null;
    }

    return Manufacturer.create(
      {
        tenantId: new EntityID(manufacturerData.tenantId),
        code: manufacturerData.code,
        sequentialCode: manufacturerData.sequentialCode,
        name: manufacturerData.name,
        legalName: manufacturerData.legalName,
        cnpj: manufacturerData.cnpj,
        country: manufacturerData.country ?? '',
        email: manufacturerData.email,
        phone: manufacturerData.phone,
        website: manufacturerData.website,
        addressLine1: manufacturerData.address,
        addressLine2: null,
        city: manufacturerData.city,
        state: manufacturerData.state,
        postalCode: manufacturerData.zipCode,
        isActive: manufacturerData.isActive,
        rating: manufacturerData.rating
          ? Number(manufacturerData.rating.toString())
          : null,
        notes: manufacturerData.notes,
        createdAt: manufacturerData.createdAt,
        updatedAt: manufacturerData.updatedAt,
      },
      new EntityID(manufacturerData.id),
    );
  }

  async findMany(tenantId: string): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          tenantId: new EntityID(manufacturerData.tenantId),
          code: manufacturerData.code,
          sequentialCode: manufacturerData.sequentialCode,
          name: manufacturerData.name,
          legalName: manufacturerData.legalName,
          cnpj: manufacturerData.cnpj,
          country: manufacturerData.country ?? '',
          email: manufacturerData.email,
          phone: manufacturerData.phone,
          website: manufacturerData.website,
          addressLine1: manufacturerData.address,
          addressLine2: null,
          city: manufacturerData.city,
          state: manufacturerData.state,
          postalCode: manufacturerData.zipCode,
          isActive: manufacturerData.isActive,
          rating: manufacturerData.rating
            ? Number(manufacturerData.rating.toString())
            : null,
          notes: manufacturerData.notes,
          createdAt: manufacturerData.createdAt,
          updatedAt: manufacturerData.updatedAt,
        },
        new EntityID(manufacturerData.id),
      ),
    );
  }

  async findManyByCountry(
    country: string,
    tenantId: string,
  ): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        country,
        tenantId,
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          tenantId: new EntityID(manufacturerData.tenantId),
          code: manufacturerData.code,
          sequentialCode: manufacturerData.sequentialCode,
          name: manufacturerData.name,
          legalName: manufacturerData.legalName,
          cnpj: manufacturerData.cnpj,
          country: manufacturerData.country ?? '',
          email: manufacturerData.email,
          phone: manufacturerData.phone,
          website: manufacturerData.website,
          addressLine1: manufacturerData.address,
          addressLine2: null,
          city: manufacturerData.city,
          state: manufacturerData.state,
          postalCode: manufacturerData.zipCode,
          isActive: manufacturerData.isActive,
          rating: manufacturerData.rating
            ? Number(manufacturerData.rating.toString())
            : null,
          notes: manufacturerData.notes,
          createdAt: manufacturerData.createdAt,
          updatedAt: manufacturerData.updatedAt,
        },
        new EntityID(manufacturerData.id),
      ),
    );
  }

  async findManyByRating(
    minRating: number,
    tenantId: string,
  ): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        rating: {
          gte: minRating,
        },
        tenantId,
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          tenantId: new EntityID(manufacturerData.tenantId),
          code: manufacturerData.code,
          sequentialCode: manufacturerData.sequentialCode,
          name: manufacturerData.name,
          legalName: manufacturerData.legalName,
          cnpj: manufacturerData.cnpj,
          country: manufacturerData.country ?? '',
          email: manufacturerData.email,
          phone: manufacturerData.phone,
          website: manufacturerData.website,
          addressLine1: manufacturerData.address,
          addressLine2: null,
          city: manufacturerData.city,
          state: manufacturerData.state,
          postalCode: manufacturerData.zipCode,
          isActive: manufacturerData.isActive,
          rating: manufacturerData.rating
            ? Number(manufacturerData.rating.toString())
            : null,
          notes: manufacturerData.notes,
          createdAt: manufacturerData.createdAt,
          updatedAt: manufacturerData.updatedAt,
        },
        new EntityID(manufacturerData.id),
      ),
    );
  }

  async findManyActive(tenantId: string): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        isActive: true,
        tenantId,
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          tenantId: new EntityID(manufacturerData.tenantId),
          code: manufacturerData.code,
          sequentialCode: manufacturerData.sequentialCode,
          name: manufacturerData.name,
          legalName: manufacturerData.legalName,
          cnpj: manufacturerData.cnpj,
          country: manufacturerData.country ?? '',
          email: manufacturerData.email,
          phone: manufacturerData.phone,
          website: manufacturerData.website,
          addressLine1: manufacturerData.address,
          addressLine2: null,
          city: manufacturerData.city,
          state: manufacturerData.state,
          postalCode: manufacturerData.zipCode,
          isActive: manufacturerData.isActive,
          rating: manufacturerData.rating
            ? Number(manufacturerData.rating.toString())
            : null,
          notes: manufacturerData.notes,
          createdAt: manufacturerData.createdAt,
          updatedAt: manufacturerData.updatedAt,
        },
        new EntityID(manufacturerData.id),
      ),
    );
  }

  async update(data: UpdateManufacturerSchema): Promise<Manufacturer | null> {
    const manufacturerData = await prisma.manufacturer.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.legalName !== undefined && { legalName: data.legalName }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.addressLine1 !== undefined && { address: data.addressLine1 }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.postalCode !== undefined && { zipCode: data.postalCode }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return Manufacturer.create(
      {
        tenantId: new EntityID(manufacturerData.tenantId),
        code: manufacturerData.code,
        sequentialCode: manufacturerData.sequentialCode,
        name: manufacturerData.name,
        legalName: manufacturerData.legalName,
        cnpj: manufacturerData.cnpj,
        country: manufacturerData.country ?? '',
        email: manufacturerData.email,
        phone: manufacturerData.phone,
        website: manufacturerData.website,
        addressLine1: manufacturerData.address,
        addressLine2: null,
        city: manufacturerData.city,
        state: manufacturerData.state,
        postalCode: manufacturerData.zipCode,
        isActive: manufacturerData.isActive,
        rating: manufacturerData.rating
          ? Number(manufacturerData.rating.toString())
          : null,
        notes: manufacturerData.notes,
        createdAt: manufacturerData.createdAt,
        updatedAt: manufacturerData.updatedAt,
      },
      new EntityID(manufacturerData.id),
    );
  }

  async save(manufacturer: Manufacturer): Promise<void> {
    await prisma.manufacturer.update({
      where: {
        id: manufacturer.manufacturerId.toString(),
      },
      data: {
        name: manufacturer.name,
        legalName: manufacturer.legalName,
        cnpj: manufacturer.cnpj,
        country: manufacturer.country,
        email: manufacturer.email,
        phone: manufacturer.phone,
        website: manufacturer.website,
        address: manufacturer.addressLine1,
        city: manufacturer.city,
        state: manufacturer.state,
        zipCode: manufacturer.postalCode,
        isActive: manufacturer.isActive,
        rating: manufacturer.rating ? manufacturer.rating : null,
        notes: manufacturer.notes,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.manufacturer.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getNextSequentialCode(_tenantId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval(pg_get_serial_sequence('manufacturers', 'sequential_code'))
    `;
    return Number(result[0].nextval);
  }
}
