import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  SupplierData,
  SuppliersRepository,
} from '@/repositories/stock/suppliers-repository';
import { prisma } from '@/lib/prisma';

export class PrismaSuppliersRepository implements SuppliersRepository {
  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SupplierData | null> {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!supplier) return null;

    return {
      id: supplier.id,
      tenantId: supplier.tenantId,
      name: supplier.name,
      cnpj: supplier.cnpj,
      email: supplier.email,
      phone: supplier.phone,
      isActive: supplier.isActive,
    };
  }
}
