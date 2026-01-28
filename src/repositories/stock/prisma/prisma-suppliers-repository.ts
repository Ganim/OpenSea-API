import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/stock/supplier';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';
import { prisma } from '@/lib/prisma';
import type {
  CreateSupplierSchema,
  SuppliersRepository,
  UpdateSupplierSchema,
} from '../suppliers-repository';

export class PrismaSuppliersRepository implements SuppliersRepository {
  async create(data: CreateSupplierSchema): Promise<Supplier> {
    const supplierData = await prisma.supplier.create({
      data: {
        name: data.name,
        cnpj: data.cnpj?.unformatted,
        taxId: data.taxId,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        paymentTerms: data.paymentTerms,
        rating: data.rating ? data.rating : undefined,
        isActive: data.isActive ?? true,
        notes: data.notes,
      },
    });

    return Supplier.create(
      {
        name: supplierData.name,
        cnpj: supplierData.cnpj
          ? (CNPJ.create(supplierData.cnpj) ?? undefined)
          : undefined,
        taxId: supplierData.taxId ?? undefined,
        contact: supplierData.contact ?? undefined,
        email: supplierData.email ?? undefined,
        phone: supplierData.phone ?? undefined,
        website: supplierData.website ?? undefined,
        address: supplierData.address ?? undefined,
        city: supplierData.city ?? undefined,
        state: supplierData.state ?? undefined,
        zipCode: supplierData.zipCode ?? undefined,
        country: supplierData.country ?? undefined,
        paymentTerms: supplierData.paymentTerms ?? undefined,
        rating: supplierData.rating
          ? Number(supplierData.rating.toString())
          : undefined,
        isActive: supplierData.isActive,
        notes: supplierData.notes ?? undefined,
        createdAt: supplierData.createdAt,
        updatedAt: supplierData.updatedAt ?? undefined,
      },
      new EntityID(supplierData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Supplier | null> {
    const supplierData = await prisma.supplier.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!supplierData) {
      return null;
    }

    return Supplier.create(
      {
        name: supplierData.name,
        cnpj: supplierData.cnpj
          ? (CNPJ.create(supplierData.cnpj) ?? undefined)
          : undefined,
        taxId: supplierData.taxId ?? undefined,
        contact: supplierData.contact ?? undefined,
        email: supplierData.email ?? undefined,
        phone: supplierData.phone ?? undefined,
        website: supplierData.website ?? undefined,
        address: supplierData.address ?? undefined,
        city: supplierData.city ?? undefined,
        state: supplierData.state ?? undefined,
        zipCode: supplierData.zipCode ?? undefined,
        country: supplierData.country ?? undefined,
        paymentTerms: supplierData.paymentTerms ?? undefined,
        rating: supplierData.rating
          ? Number(supplierData.rating.toString())
          : undefined,
        isActive: supplierData.isActive,
        notes: supplierData.notes ?? undefined,
        createdAt: supplierData.createdAt,
        updatedAt: supplierData.updatedAt ?? undefined,
      },
      new EntityID(supplierData.id),
    );
  }

  async findByCNPJ(cnpj: CNPJ): Promise<Supplier | null> {
    const supplierData = await prisma.supplier.findFirst({
      where: {
        cnpj: cnpj.unformatted,
        deletedAt: null,
      },
    });

    if (!supplierData) {
      return null;
    }

    return Supplier.create(
      {
        name: supplierData.name,
        cnpj: supplierData.cnpj
          ? (CNPJ.create(supplierData.cnpj) ?? undefined)
          : undefined,
        taxId: supplierData.taxId ?? undefined,
        contact: supplierData.contact ?? undefined,
        email: supplierData.email ?? undefined,
        phone: supplierData.phone ?? undefined,
        website: supplierData.website ?? undefined,
        address: supplierData.address ?? undefined,
        city: supplierData.city ?? undefined,
        state: supplierData.state ?? undefined,
        zipCode: supplierData.zipCode ?? undefined,
        country: supplierData.country ?? undefined,
        paymentTerms: supplierData.paymentTerms ?? undefined,
        rating: supplierData.rating
          ? Number(supplierData.rating.toString())
          : undefined,
        isActive: supplierData.isActive,
        notes: supplierData.notes ?? undefined,
        createdAt: supplierData.createdAt,
        updatedAt: supplierData.updatedAt ?? undefined,
      },
      new EntityID(supplierData.id),
    );
  }

  async findByName(name: string): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      Supplier.create(
        {
          name: supplierData.name,
          cnpj: supplierData.cnpj
            ? (CNPJ.create(supplierData.cnpj) ?? undefined)
            : undefined,
          taxId: supplierData.taxId ?? undefined,
          contact: supplierData.contact ?? undefined,
          email: supplierData.email ?? undefined,
          phone: supplierData.phone ?? undefined,
          website: supplierData.website ?? undefined,
          address: supplierData.address ?? undefined,
          city: supplierData.city ?? undefined,
          state: supplierData.state ?? undefined,
          zipCode: supplierData.zipCode ?? undefined,
          country: supplierData.country ?? undefined,
          paymentTerms: supplierData.paymentTerms ?? undefined,
          rating: supplierData.rating
            ? Number(supplierData.rating.toString())
            : undefined,
          isActive: supplierData.isActive,
          notes: supplierData.notes ?? undefined,
          createdAt: supplierData.createdAt,
          updatedAt: supplierData.updatedAt ?? undefined,
        },
        new EntityID(supplierData.id),
      ),
    );
  }

  async findManyByRating(minRating: number): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        rating: {
          gte: minRating,
        },
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      Supplier.create(
        {
          name: supplierData.name,
          cnpj: supplierData.cnpj
            ? (CNPJ.create(supplierData.cnpj) ?? undefined)
            : undefined,
          taxId: supplierData.taxId ?? undefined,
          contact: supplierData.contact ?? undefined,
          email: supplierData.email ?? undefined,
          phone: supplierData.phone ?? undefined,
          website: supplierData.website ?? undefined,
          address: supplierData.address ?? undefined,
          city: supplierData.city ?? undefined,
          state: supplierData.state ?? undefined,
          zipCode: supplierData.zipCode ?? undefined,
          country: supplierData.country ?? undefined,
          paymentTerms: supplierData.paymentTerms ?? undefined,
          rating: supplierData.rating
            ? Number(supplierData.rating.toString())
            : undefined,
          isActive: supplierData.isActive,
          notes: supplierData.notes ?? undefined,
          createdAt: supplierData.createdAt,
          updatedAt: supplierData.updatedAt ?? undefined,
        },
        new EntityID(supplierData.id),
      ),
    );
  }

  async findMany(): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      Supplier.create(
        {
          name: supplierData.name,
          cnpj: supplierData.cnpj
            ? (CNPJ.create(supplierData.cnpj) ?? undefined)
            : undefined,
          taxId: supplierData.taxId ?? undefined,
          contact: supplierData.contact ?? undefined,
          email: supplierData.email ?? undefined,
          phone: supplierData.phone ?? undefined,
          website: supplierData.website ?? undefined,
          address: supplierData.address ?? undefined,
          city: supplierData.city ?? undefined,
          state: supplierData.state ?? undefined,
          zipCode: supplierData.zipCode ?? undefined,
          country: supplierData.country ?? undefined,
          paymentTerms: supplierData.paymentTerms ?? undefined,
          rating: supplierData.rating
            ? Number(supplierData.rating.toString())
            : undefined,
          isActive: supplierData.isActive,
          notes: supplierData.notes ?? undefined,
          createdAt: supplierData.createdAt,
          updatedAt: supplierData.updatedAt ?? undefined,
        },
        new EntityID(supplierData.id),
      ),
    );
  }

  async findManyActive(): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    return suppliers.map((supplierData) =>
      Supplier.create(
        {
          name: supplierData.name,
          cnpj: supplierData.cnpj
            ? (CNPJ.create(supplierData.cnpj) ?? undefined)
            : undefined,
          taxId: supplierData.taxId ?? undefined,
          contact: supplierData.contact ?? undefined,
          email: supplierData.email ?? undefined,
          phone: supplierData.phone ?? undefined,
          website: supplierData.website ?? undefined,
          address: supplierData.address ?? undefined,
          city: supplierData.city ?? undefined,
          state: supplierData.state ?? undefined,
          zipCode: supplierData.zipCode ?? undefined,
          country: supplierData.country ?? undefined,
          paymentTerms: supplierData.paymentTerms ?? undefined,
          rating: supplierData.rating
            ? Number(supplierData.rating.toString())
            : undefined,
          isActive: supplierData.isActive,
          notes: supplierData.notes ?? undefined,
          createdAt: supplierData.createdAt,
          updatedAt: supplierData.updatedAt ?? undefined,
        },
        new EntityID(supplierData.id),
      ),
    );
  }

  async update(data: UpdateSupplierSchema): Promise<Supplier | null> {
    const supplierData = await prisma.supplier.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        cnpj: data.cnpj?.unformatted,
        taxId: data.taxId,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        paymentTerms: data.paymentTerms,
        rating: data.rating ? data.rating : undefined,
        isActive: data.isActive,
        notes: data.notes,
      },
    });

    return Supplier.create(
      {
        name: supplierData.name,
        cnpj: supplierData.cnpj
          ? (CNPJ.create(supplierData.cnpj) ?? undefined)
          : undefined,
        taxId: supplierData.taxId ?? undefined,
        contact: supplierData.contact ?? undefined,
        email: supplierData.email ?? undefined,
        phone: supplierData.phone ?? undefined,
        website: supplierData.website ?? undefined,
        address: supplierData.address ?? undefined,
        city: supplierData.city ?? undefined,
        state: supplierData.state ?? undefined,
        zipCode: supplierData.zipCode ?? undefined,
        country: supplierData.country ?? undefined,
        paymentTerms: supplierData.paymentTerms ?? undefined,
        rating: supplierData.rating
          ? Number(supplierData.rating.toString())
          : undefined,
        isActive: supplierData.isActive,
        notes: supplierData.notes ?? undefined,
        createdAt: supplierData.createdAt,
        updatedAt: supplierData.updatedAt ?? undefined,
      },
      new EntityID(supplierData.id),
    );
  }

  async save(supplier: Supplier): Promise<void> {
    await prisma.supplier.update({
      where: {
        id: supplier.id.toString(),
      },
      data: {
        name: supplier.name,
        cnpj: supplier.cnpj?.unformatted,
        taxId: supplier.taxId,
        contact: supplier.contact,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        zipCode: supplier.zipCode,
        country: supplier.country,
        paymentTerms: supplier.paymentTerms,
        rating: supplier.rating ? supplier.rating : undefined,
        isActive: supplier.isActive,
        notes: supplier.notes,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.supplier.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
