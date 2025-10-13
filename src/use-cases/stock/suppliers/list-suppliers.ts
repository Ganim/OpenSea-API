import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface ListSuppliersUseCaseResponse {
  suppliers: Array<{
    id: string;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    isActive: boolean;
    rating?: number;
    createdAt: Date;
  }>;
}

export class ListSuppliersUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(): Promise<ListSuppliersUseCaseResponse> {
    const suppliers = await this.suppliersRepository.findMany();

    return {
      suppliers: suppliers.map((supplier) => ({
        id: supplier.id.toString(),
        name: supplier.name,
        cnpj: supplier.cnpj?.toString(),
        email: supplier.email,
        phone: supplier.phone,
        city: supplier.city,
        state: supplier.state,
        isActive: supplier.isActive,
        rating: supplier.rating,
        createdAt: supplier.createdAt,
      })),
    };
  }
}
