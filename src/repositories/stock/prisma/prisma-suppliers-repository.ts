import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/stock/supplier';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';
import { prisma } from '@/lib/prisma';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type {
  CreateSupplierSchema,
  SuppliersRepository,
  UpdateSupplierSchema,
} from '../suppliers-repository';

const { encryptedFields, hashFields } = ENCRYPTED_FIELD_CONFIG.Supplier;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

function decryptSupplierData<T extends Record<string, unknown>>(data: T): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  return cipher.decryptFields(data, encryptedFields);
}

function mapToDomain(supplierData: Record<string, unknown>): Supplier {
  const d = decryptSupplierData(supplierData);
  return Supplier.create(
    {
      tenantId: new EntityID(d.tenantId as string),
      name: d.name as string,
      cnpj: d.cnpj ? (CNPJ.create(d.cnpj as string) ?? undefined) : undefined,
      taxId: (d.taxId as string) ?? undefined,
      contact: (d.contact as string) ?? undefined,
      email: (d.email as string) ?? undefined,
      phone: (d.phone as string) ?? undefined,
      website: (d.website as string) ?? undefined,
      address: (d.address as string) ?? undefined,
      city: (d.city as string) ?? undefined,
      state: (d.state as string) ?? undefined,
      zipCode: (d.zipCode as string) ?? undefined,
      country: (d.country as string) ?? undefined,
      paymentTerms: (d.paymentTerms as string) ?? undefined,
      rating: d.rating ? Number(d.rating.toString()) : undefined,
      isActive: d.isActive as boolean,
      notes: (d.notes as string) ?? undefined,
      createdAt: d.createdAt as Date,
      updatedAt: (d.updatedAt as Date) ?? undefined,
    },
    new EntityID(d.id as string),
  );
}

export class PrismaSuppliersRepository implements SuppliersRepository {
  async create(data: CreateSupplierSchema): Promise<Supplier> {
    const cipher = tryGetCipher();

    const plainValues: Record<string, string | null | undefined> = {
      cnpj: data.cnpj?.unformatted,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    const supplierData = await prisma.supplier.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        cnpj: encryptedValues.cnpj ?? undefined,
        taxId: data.taxId,
        contact: encryptedValues.contact ?? undefined,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        website: data.website,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        country: data.country,
        paymentTerms: data.paymentTerms,
        rating: data.rating ? data.rating : undefined,
        isActive: data.isActive ?? true,
        notes: data.notes,
        ...hashes,
      },
    });

    return mapToDomain(supplierData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Supplier | null> {
    const supplierData = await prisma.supplier.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!supplierData) {
      return null;
    }

    return mapToDomain(supplierData as unknown as Record<string, unknown>);
  }

  async findByCNPJ(cnpj: CNPJ, tenantId: string): Promise<Supplier | null> {
    const cipher = tryGetCipher();
    const cnpjHash = cipher ? cipher.blindIndex(cnpj.unformatted) : null;

    const where =
      cipher && cnpjHash
        ? { cnpjHash, tenantId, deletedAt: null }
        : { cnpj: cnpj.unformatted, tenantId, deletedAt: null };

    const supplierData = await prisma.supplier.findFirst({
      where,
    });

    if (!supplierData) {
      return null;
    }

    return mapToDomain(supplierData as unknown as Record<string, unknown>);
  }

  async findByName(name: string, tenantId: string): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        tenantId,
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      mapToDomain(supplierData as unknown as Record<string, unknown>),
    );
  }

  async findManyByRating(
    minRating: number,
    tenantId: string,
  ): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        rating: {
          gte: minRating,
        },
        tenantId,
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      mapToDomain(supplierData as unknown as Record<string, unknown>),
    );
  }

  async findMany(tenantId: string): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      mapToDomain(supplierData as unknown as Record<string, unknown>),
    );
  }

  async findManyActive(tenantId: string): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        tenantId,
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      mapToDomain(supplierData as unknown as Record<string, unknown>),
    );
  }

  async update(data: UpdateSupplierSchema): Promise<Supplier | null> {
    const cipher = tryGetCipher();

    const plainValues: Record<string, string | null | undefined> = {
      cnpj: data.cnpj?.unformatted,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    const supplierData = await prisma.supplier.update({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
      },
      data: {
        name: data.name,
        cnpj: encryptedValues.cnpj ?? undefined,
        taxId: data.taxId,
        contact: encryptedValues.contact ?? undefined,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        website: data.website,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        country: data.country,
        paymentTerms: data.paymentTerms,
        rating: data.rating ? data.rating : undefined,
        isActive: data.isActive,
        notes: data.notes,
        ...hashes,
      },
    });

    return mapToDomain(supplierData as unknown as Record<string, unknown>);
  }

  async save(supplier: Supplier): Promise<void> {
    const cipher = tryGetCipher();

    const plainValues: Record<string, string | null | undefined> = {
      cnpj: supplier.cnpj?.unformatted,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      zipCode: supplier.zipCode,
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    await prisma.supplier.update({
      where: {
        id: supplier.id.toString(),
      },
      data: {
        name: supplier.name,
        cnpj: encryptedValues.cnpj ?? undefined,
        taxId: supplier.taxId,
        contact: encryptedValues.contact ?? undefined,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        website: supplier.website,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        country: supplier.country,
        paymentTerms: supplier.paymentTerms,
        rating: supplier.rating ? supplier.rating : undefined,
        isActive: supplier.isActive,
        notes: supplier.notes,
        updatedAt: new Date(),
        ...hashes,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.supplier.update({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
