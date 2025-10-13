import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/stock/manufacturer';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
  UpdateManufacturerSchema,
} from '../manufacturers-repository';

export class PrismaManufacturersRepository implements ManufacturersRepository {
  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    const manufacturerData = await prisma.manufacturer.create({
      data: {
        name: data.name,
        country: data.country,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.addressLine1,
        city: data.city,
        state: data.state,
        zipCode: data.postalCode,
        isActive: data.isActive ?? true,
        rating: data.rating ? new Decimal(data.rating) : undefined,
        notes: data.notes,
      },
    });

    return Manufacturer.create(
      {
        name: manufacturerData.name,
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

  async findById(id: UniqueEntityID): Promise<Manufacturer | null> {
    const manufacturerData = await prisma.manufacturer.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!manufacturerData) {
      return null;
    }

    return Manufacturer.create(
      {
        name: manufacturerData.name,
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

  async findByName(name: string): Promise<Manufacturer | null> {
    const manufacturerData = await prisma.manufacturer.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (!manufacturerData) {
      return null;
    }

    return Manufacturer.create(
      {
        name: manufacturerData.name,
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

  async findMany(): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          name: manufacturerData.name,
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

  async findManyByCountry(country: string): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        country,
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          name: manufacturerData.name,
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

  async findManyByRating(minRating: number): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        rating: {
          gte: new Decimal(minRating),
        },
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          name: manufacturerData.name,
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

  async findManyActive(): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    return manufacturers.map((manufacturerData) =>
      Manufacturer.create(
        {
          name: manufacturerData.name,
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
        name: data.name,
        country: data.country,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.addressLine1,
        city: data.city,
        state: data.state,
        zipCode: data.postalCode,
        isActive: data.isActive,
        rating: data.rating ? new Decimal(data.rating) : undefined,
        notes: data.notes,
      },
    });

    return Manufacturer.create(
      {
        name: manufacturerData.name,
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
        country: manufacturer.country,
        email: manufacturer.email,
        phone: manufacturer.phone,
        website: manufacturer.website,
        address: manufacturer.addressLine1,
        city: manufacturer.city,
        state: manufacturer.state,
        zipCode: manufacturer.postalCode,
        isActive: manufacturer.isActive,
        rating: manufacturer.rating ? new Decimal(manufacturer.rating) : null,
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
}
