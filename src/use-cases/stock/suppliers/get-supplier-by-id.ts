import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface GetSupplierByIdUseCaseRequest {
  id: string;
}

interface GetSupplierByIdUseCaseResponse {
  supplier: {
    id: string;
    name: string;
    cnpj?: string;
    taxId?: string;
    contact?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    paymentTerms?: string;
    rating?: number;
    isActive: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt?: Date;
  };
}

export class GetSupplierByIdUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute({
    id,
  }: GetSupplierByIdUseCaseRequest): Promise<GetSupplierByIdUseCaseResponse> {
    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    return {
      supplier: {
        id: supplier.id.toString(),
        name: supplier.name,
        cnpj: supplier.cnpj?.toString(),
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
        rating: supplier.rating,
        isActive: supplier.isActive,
        notes: supplier.notes,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
    };
  }
}
