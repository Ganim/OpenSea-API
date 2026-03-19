import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/stock/manufacturer';
import { prisma } from '@/lib/prisma';
import type {
  PaginatedResult,
  PaginationParams,
} from '@/repositories/pagination-params';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type { Prisma } from '@prisma/generated/client';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
  UpdateManufacturerSchema,
} from '../manufacturers-repository';

const { encryptedFields, hashFields } = ENCRYPTED_FIELD_CONFIG.Manufacturer;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

/**
 * Decrypts the DB-level field names (address, zipCode) which correspond
 * to the Prisma column names used in ENCRYPTED_FIELD_CONFIG.Manufacturer.
 */
function decryptManufacturerData<T extends Record<string, unknown>>(
  data: T,
): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  return cipher.decryptFields(data, encryptedFields);
}

function mapToDomain(m: Record<string, unknown>): Manufacturer {
  const d = decryptManufacturerData(m);
  return Manufacturer.create(
    {
      tenantId: new EntityID(d.tenantId as string),
      code: d.code as string,
      sequentialCode: d.sequentialCode as number,
      name: d.name as string,
      legalName: d.legalName as string | null,
      cnpj: d.cnpj as string | null,
      country: (d.country as string) ?? '',
      email: d.email as string | null,
      phone: d.phone as string | null,
      website: d.website as string | null,
      addressLine1: d.address as string | null,
      addressLine2: null,
      city: d.city as string | null,
      state: d.state as string | null,
      postalCode: d.zipCode as string | null,
      isActive: d.isActive as boolean,
      rating: d.rating ? Number(d.rating.toString()) : null,
      notes: d.notes as string | null,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
    },
    new EntityID(d.id as string),
  );
}

export class PrismaManufacturersRepository implements ManufacturersRepository {
  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    const cipher = tryGetCipher();

    // Map domain field names to DB column names for encryption
    const plainValues: Record<string, string | null | undefined> = {
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      address: data.addressLine1, // domain addressLine1 -> DB address
      city: data.city,
      state: data.state,
      zipCode: data.postalCode, // domain postalCode -> DB zipCode
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    const manufacturerData = await prisma.manufacturer.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        legalName: data.legalName,
        cnpj: encryptedValues.cnpj ?? undefined,
        country: data.country,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        website: data.website,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        isActive: data.isActive ?? true,
        rating: data.rating ? data.rating : undefined,
        notes: data.notes,
        ...hashes,
      },
    });

    return mapToDomain(manufacturerData as unknown as Record<string, unknown>);
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

    return mapToDomain(manufacturerData as unknown as Record<string, unknown>);
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

    return mapToDomain(manufacturerData as unknown as Record<string, unknown>);
  }

  async findMany(tenantId: string): Promise<Manufacturer[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    return manufacturers.map((m) =>
      mapToDomain(m as unknown as Record<string, unknown>),
    );
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams & {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResult<Manufacturer>> {
    const where: Prisma.ManufacturerWhereInput = {
      tenantId,
      deletedAt: null,
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [manufacturers, total] = await Promise.all([
      prisma.manufacturer.findMany({
        where,
        orderBy: {
          [params.sortBy ?? 'name']: params.sortOrder ?? 'asc',
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.manufacturer.count({ where }),
    ]);

    return {
      data: manufacturers.map((m) =>
        mapToDomain(m as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
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

    return manufacturers.map((m) =>
      mapToDomain(m as unknown as Record<string, unknown>),
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

    return manufacturers.map((m) =>
      mapToDomain(m as unknown as Record<string, unknown>),
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

    return manufacturers.map((m) =>
      mapToDomain(m as unknown as Record<string, unknown>),
    );
  }

  async update(data: UpdateManufacturerSchema): Promise<Manufacturer | null> {
    const cipher = tryGetCipher();

    // Map domain field names to DB column names for encryption
    const plainValues: Record<string, string | null | undefined> = {
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      address: data.addressLine1, // domain addressLine1 -> DB address
      city: data.city,
      state: data.state,
      zipCode: data.postalCode, // domain postalCode -> DB zipCode
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    const manufacturerData = await prisma.manufacturer.update({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.legalName !== undefined && { legalName: data.legalName }),
        ...(data.cnpj !== undefined && { cnpj: encryptedValues.cnpj }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.email !== undefined && { email: encryptedValues.email }),
        ...(data.phone !== undefined && { phone: encryptedValues.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.addressLine1 !== undefined && {
          address: encryptedValues.address,
        }),
        ...(data.city !== undefined && { city: encryptedValues.city }),
        ...(data.state !== undefined && { state: encryptedValues.state }),
        ...(data.postalCode !== undefined && {
          zipCode: encryptedValues.zipCode,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...hashes,
      },
    });

    return mapToDomain(manufacturerData as unknown as Record<string, unknown>);
  }

  async save(manufacturer: Manufacturer): Promise<void> {
    const cipher = tryGetCipher();

    const plainValues: Record<string, string | null | undefined> = {
      cnpj: manufacturer.cnpj,
      email: manufacturer.email,
      phone: manufacturer.phone,
      address: manufacturer.addressLine1,
      city: manufacturer.city,
      state: manufacturer.state,
      zipCode: manufacturer.postalCode,
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    await prisma.manufacturer.update({
      where: {
        id: manufacturer.manufacturerId.toString(),
      },
      data: {
        name: manufacturer.name,
        legalName: manufacturer.legalName,
        cnpj: encryptedValues.cnpj ?? undefined,
        country: manufacturer.country,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        website: manufacturer.website,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        isActive: manufacturer.isActive,
        rating: manufacturer.rating ? manufacturer.rating : null,
        notes: manufacturer.notes,
        updatedAt: new Date(),
        ...hashes,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.manufacturer.update({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
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
