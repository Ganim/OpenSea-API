import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import { prisma } from '@/lib/prisma';
import type { CustomerType as PrismaCustomerType } from '@prisma/generated/client.js';
import type {
  CreateCustomerSchema,
  CustomersRepository,
  UpdateCustomerSchema,
} from '../customers-repository';

export class PrismaCustomersRepository implements CustomersRepository {
  async create(data: CreateCustomerSchema): Promise<Customer> {
    const customerData = await prisma.customer.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type.value as PrismaCustomerType,
        document: data.document?.value,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        notes: data.notes,
        isActive: data.isActive ?? true,
      },
    });

    return Customer.create(
      {
        tenantId: new EntityID(customerData.tenantId),
        name: customerData.name,
        type: CustomerType.create(customerData.type),
        document: customerData.document
          ? Document.create(customerData.document)
          : undefined,
        email: customerData.email ?? undefined,
        phone: customerData.phone ?? undefined,
        address: customerData.address ?? undefined,
        city: customerData.city ?? undefined,
        state: customerData.state ?? undefined,
        zipCode: customerData.zipCode ?? undefined,
        country: customerData.country ?? undefined,
        notes: customerData.notes ?? undefined,
        isActive: customerData.isActive,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
        deletedAt: customerData.deletedAt ?? undefined,
      },
      new EntityID(customerData.id),
    );
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

    return Customer.create(
      {
        tenantId: new EntityID(customerData.tenantId),
        name: customerData.name,
        type: CustomerType.create(customerData.type),
        document: customerData.document
          ? Document.create(customerData.document)
          : undefined,
        email: customerData.email ?? undefined,
        phone: customerData.phone ?? undefined,
        address: customerData.address ?? undefined,
        city: customerData.city ?? undefined,
        state: customerData.state ?? undefined,
        zipCode: customerData.zipCode ?? undefined,
        country: customerData.country ?? undefined,
        notes: customerData.notes ?? undefined,
        isActive: customerData.isActive,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
        deletedAt: customerData.deletedAt ?? undefined,
      },
      new EntityID(customerData.id),
    );
  }

  async findByDocument(
    document: Document,
    tenantId: string,
  ): Promise<Customer | null> {
    const customerData = await prisma.customer.findFirst({
      where: {
        document: document.value,
        tenantId,
        deletedAt: null,
      },
    });

    if (!customerData) return null;

    return Customer.create(
      {
        tenantId: new EntityID(customerData.tenantId),
        name: customerData.name,
        type: CustomerType.create(customerData.type),
        document: Document.create(customerData.document!),
        email: customerData.email ?? undefined,
        phone: customerData.phone ?? undefined,
        address: customerData.address ?? undefined,
        city: customerData.city ?? undefined,
        state: customerData.state ?? undefined,
        zipCode: customerData.zipCode ?? undefined,
        country: customerData.country ?? undefined,
        notes: customerData.notes ?? undefined,
        isActive: customerData.isActive,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
        deletedAt: customerData.deletedAt ?? undefined,
      },
      new EntityID(customerData.id),
    );
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const customerData = await prisma.customer.findFirst({
      where: {
        email,
        tenantId,
        deletedAt: null,
      },
    });

    if (!customerData) return null;

    return Customer.create(
      {
        tenantId: new EntityID(customerData.tenantId),
        name: customerData.name,
        type: CustomerType.create(customerData.type),
        document: customerData.document
          ? Document.create(customerData.document)
          : undefined,
        email: customerData.email ?? undefined,
        phone: customerData.phone ?? undefined,
        address: customerData.address ?? undefined,
        city: customerData.city ?? undefined,
        state: customerData.state ?? undefined,
        zipCode: customerData.zipCode ?? undefined,
        country: customerData.country ?? undefined,
        notes: customerData.notes ?? undefined,
        isActive: customerData.isActive,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
        deletedAt: customerData.deletedAt ?? undefined,
      },
      new EntityID(customerData.id),
    );
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
      Customer.create(
        {
          tenantId: new EntityID(customerData.tenantId),
          name: customerData.name,
          type: CustomerType.create(customerData.type),
          document: customerData.document
            ? Document.create(customerData.document)
            : undefined,
          email: customerData.email ?? undefined,
          phone: customerData.phone ?? undefined,
          address: customerData.address ?? undefined,
          city: customerData.city ?? undefined,
          state: customerData.state ?? undefined,
          zipCode: customerData.zipCode ?? undefined,
          country: customerData.country ?? undefined,
          notes: customerData.notes ?? undefined,
          isActive: customerData.isActive,
          createdAt: customerData.createdAt,
          updatedAt: customerData.updatedAt,
          deletedAt: customerData.deletedAt ?? undefined,
        },
        new EntityID(customerData.id),
      ),
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
      Customer.create(
        {
          tenantId: new EntityID(customerData.tenantId),
          name: customerData.name,
          type: CustomerType.create(customerData.type),
          document: customerData.document
            ? Document.create(customerData.document)
            : undefined,
          email: customerData.email ?? undefined,
          phone: customerData.phone ?? undefined,
          address: customerData.address ?? undefined,
          city: customerData.city ?? undefined,
          state: customerData.state ?? undefined,
          zipCode: customerData.zipCode ?? undefined,
          country: customerData.country ?? undefined,
          notes: customerData.notes ?? undefined,
          isActive: customerData.isActive,
          createdAt: customerData.createdAt,
          updatedAt: customerData.updatedAt,
          deletedAt: customerData.deletedAt ?? undefined,
        },
        new EntityID(customerData.id),
      ),
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
      Customer.create(
        {
          tenantId: new EntityID(customerData.tenantId),
          name: customerData.name,
          type: CustomerType.create(customerData.type),
          document: customerData.document
            ? Document.create(customerData.document)
            : undefined,
          email: customerData.email ?? undefined,
          phone: customerData.phone ?? undefined,
          address: customerData.address ?? undefined,
          city: customerData.city ?? undefined,
          state: customerData.state ?? undefined,
          zipCode: customerData.zipCode ?? undefined,
          country: customerData.country ?? undefined,
          notes: customerData.notes ?? undefined,
          isActive: customerData.isActive,
          createdAt: customerData.createdAt,
          updatedAt: customerData.updatedAt,
          deletedAt: customerData.deletedAt ?? undefined,
        },
        new EntityID(customerData.id),
      ),
    );
  }

  async update(data: UpdateCustomerSchema): Promise<Customer | null> {
    try {
      const customerData = await prisma.customer.update({
        where: { id: data.id.toString() },
        data: {
          name: data.name,
          type: data.type?.value as PrismaCustomerType | undefined,
          document: data.document?.value,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          notes: data.notes,
          isActive: data.isActive,
        },
      });

      return Customer.create(
        {
          tenantId: new EntityID(customerData.tenantId),
          name: customerData.name,
          type: CustomerType.create(customerData.type),
          document: customerData.document
            ? Document.create(customerData.document)
            : undefined,
          email: customerData.email ?? undefined,
          phone: customerData.phone ?? undefined,
          address: customerData.address ?? undefined,
          city: customerData.city ?? undefined,
          state: customerData.state ?? undefined,
          zipCode: customerData.zipCode ?? undefined,
          country: customerData.country ?? undefined,
          notes: customerData.notes ?? undefined,
          isActive: customerData.isActive,
          createdAt: customerData.createdAt,
          updatedAt: customerData.updatedAt,
          deletedAt: customerData.deletedAt ?? undefined,
        },
        new EntityID(customerData.id),
      );
    } catch {
      return null;
    }
  }

  async save(customer: Customer): Promise<void> {
    await prisma.customer.upsert({
      where: { id: customer.id.toString() },
      create: {
        id: customer.id.toString(),
        tenantId: customer.tenantId.toString(),
        name: customer.name,
        type: customer.type.value as PrismaCustomerType,
        document: customer.document?.value,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        notes: customer.notes,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt ?? new Date(),
        deletedAt: customer.deletedAt,
      },
      update: {
        name: customer.name,
        type: customer.type.value as PrismaCustomerType,
        document: customer.document?.value,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        notes: customer.notes,
        isActive: customer.isActive,
        updatedAt: customer.updatedAt ?? new Date(),
        deletedAt: customer.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.customer.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
