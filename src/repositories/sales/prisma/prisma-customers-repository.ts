import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import { prisma } from '@/lib/prisma';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type { CustomerType as PrismaCustomerType } from '@prisma/generated/client.js';
import type {
  CreateCustomerSchema,
  CustomersRepository,
  UpdateCustomerSchema,
} from '../customers-repository';

const { encryptedFields, hashFields } = ENCRYPTED_FIELD_CONFIG.Customer;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

function decryptCustomerData<T extends Record<string, unknown>>(data: T): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  return cipher.decryptFields(data, encryptedFields);
}

function mapToDomain(customerData: Record<string, unknown>): Customer {
  const d = decryptCustomerData(customerData);
  return Customer.create(
    {
      tenantId: new EntityID(d.tenantId as string),
      name: d.name as string,
      type: CustomerType.create(d.type as string),
      document: d.document
        ? Document.fromPersistence(d.document as string)
        : undefined,
      email: (d.email as string) ?? undefined,
      phone: (d.phone as string) ?? undefined,
      address: (d.address as string) ?? undefined,
      city: (d.city as string) ?? undefined,
      state: (d.state as string) ?? undefined,
      zipCode: (d.zipCode as string) ?? undefined,
      country: (d.country as string) ?? undefined,
      notes: (d.notes as string) ?? undefined,
      isActive: d.isActive as boolean,
      isSystem: (d.isSystem as boolean) ?? false,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
      deletedAt: (d.deletedAt as Date) ?? undefined,
    },
    new EntityID(d.id as string),
  );
}

export class PrismaCustomersRepository implements CustomersRepository {
  async create(data: CreateCustomerSchema): Promise<Customer> {
    const cipher = tryGetCipher();

    const plainValues: Record<string, string | null | undefined> = {
      document: data.document?.value,
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

    const customerData = await prisma.customer.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type.value as PrismaCustomerType,
        document: encryptedValues.document ?? undefined,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        country: data.country,
        notes: data.notes,
        isActive: data.isActive ?? true,
        ...hashes,
      },
    });

    return mapToDomain(customerData as unknown as Record<string, unknown>);
  }

  async findSystemDefault(tenantId: string): Promise<Customer | null> {
    const customerData = await prisma.customer.findFirst({
      where: {
        isSystem: true,
        tenantId,
        deletedAt: null,
      },
    });

    if (!customerData) return null;

    return mapToDomain(customerData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Customer | null> {
    const customerData = await prisma.customer.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!customerData) return null;

    return mapToDomain(customerData as unknown as Record<string, unknown>);
  }

  async findByDocument(
    document: Document,
    tenantId: string,
  ): Promise<Customer | null> {
    const cipher = tryGetCipher();
    const documentHash = cipher ? cipher.blindIndex(document.value) : null;

    const where =
      cipher && documentHash
        ? { documentHash, tenantId, deletedAt: null }
        : { document: document.value, tenantId, deletedAt: null };

    const customerData = await prisma.customer.findFirst({
      where,
    });

    if (!customerData) return null;

    return mapToDomain(customerData as unknown as Record<string, unknown>);
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const cipher = tryGetCipher();
    const emailHash = cipher ? cipher.blindIndex(email) : null;

    const where =
      cipher && emailHash
        ? { emailHash, tenantId, deletedAt: null }
        : { email, tenantId, deletedAt: null };

    const customerData = await prisma.customer.findFirst({
      where,
    });

    if (!customerData) return null;

    return mapToDomain(customerData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]> {
    const customersData = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return customersData.map((customerData) =>
      mapToDomain(customerData as unknown as Record<string, unknown>),
    );
  }

  async findManyActive(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]> {
    const customersData = await prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return customersData.map((customerData) =>
      mapToDomain(customerData as unknown as Record<string, unknown>),
    );
  }

  async findManyByType(
    type: CustomerType,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]> {
    const customersData = await prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        type: type.value as PrismaCustomerType,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return customersData.map((customerData) =>
      mapToDomain(customerData as unknown as Record<string, unknown>),
    );
  }

  async update(data: UpdateCustomerSchema): Promise<Customer | null> {
    try {
      const cipher = tryGetCipher();

      const plainValues: Record<string, string | null | undefined> = {
        document: data.document?.value,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      };

      const hashes = cipher
        ? cipher.generateHashes(plainValues, hashFields)
        : {};

      const encryptedValues = cipher
        ? cipher.encryptFields({ ...plainValues }, encryptedFields)
        : plainValues;

      const customerData = await prisma.customer.update({
        where: {
          id: data.id.toString(),
          tenantId: data.tenantId,
        },
        data: {
          name: data.name,
          type: data.type?.value as PrismaCustomerType | undefined,
          document: encryptedValues.document ?? undefined,
          email: encryptedValues.email ?? undefined,
          phone: encryptedValues.phone ?? undefined,
          address: encryptedValues.address ?? undefined,
          city: encryptedValues.city ?? undefined,
          state: encryptedValues.state ?? undefined,
          zipCode: encryptedValues.zipCode ?? undefined,
          country: data.country,
          notes: data.notes,
          isActive: data.isActive,
          ...hashes,
        },
      });

      return mapToDomain(customerData as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async save(customer: Customer): Promise<void> {
    const cipher = tryGetCipher();

    const plainValues: Record<string, string | null | undefined> = {
      document: customer.document?.value,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
    };

    const hashes = cipher ? cipher.generateHashes(plainValues, hashFields) : {};

    const encryptedValues = cipher
      ? cipher.encryptFields({ ...plainValues }, encryptedFields)
      : plainValues;

    await prisma.customer.upsert({
      where: { id: customer.id.toString() },
      create: {
        id: customer.id.toString(),
        tenantId: customer.tenantId.toString(),
        name: customer.name,
        type: customer.type.value as PrismaCustomerType,
        document: encryptedValues.document ?? undefined,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        country: customer.country,
        notes: customer.notes,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt ?? new Date(),
        deletedAt: customer.deletedAt,
        ...hashes,
      },
      update: {
        name: customer.name,
        type: customer.type.value as PrismaCustomerType,
        document: encryptedValues.document ?? undefined,
        email: encryptedValues.email ?? undefined,
        phone: encryptedValues.phone ?? undefined,
        address: encryptedValues.address ?? undefined,
        city: encryptedValues.city ?? undefined,
        state: encryptedValues.state ?? undefined,
        zipCode: encryptedValues.zipCode ?? undefined,
        country: customer.country,
        notes: customer.notes,
        isActive: customer.isActive,
        updatedAt: customer.updatedAt ?? new Date(),
        deletedAt: customer.deletedAt,
        ...hashes,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.customer.update({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
