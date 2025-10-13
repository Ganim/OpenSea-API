import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface CreateSupplierUseCaseRequest {
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
  isActive?: boolean;
  notes?: string;
}

interface CreateSupplierUseCaseResponse {
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

export class CreateSupplierUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute({
    name,
    cnpj,
    taxId,
    contact,
    email,
    phone,
    website,
    address,
    city,
    state,
    zipCode,
    country,
    paymentTerms,
    rating,
    isActive,
    notes,
  }: CreateSupplierUseCaseRequest): Promise<CreateSupplierUseCaseResponse> {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Supplier name is required');
    }

    if (name.length > 200) {
      throw new BadRequestError('Supplier name must be at most 200 characters');
    }

    // Validate and parse CNPJ if provided
    let supplierCNPJ: CNPJ | undefined;
    if (cnpj && cnpj.trim().length > 0) {
      const parsedCNPJ = CNPJ.create(cnpj);
      if (!parsedCNPJ) {
        throw new BadRequestError('Invalid CNPJ format');
      }
      supplierCNPJ = parsedCNPJ;

      // Check if CNPJ already exists
      const existingSupplier =
        await this.suppliersRepository.findByCNPJ(supplierCNPJ);
      if (existingSupplier) {
        throw new BadRequestError('A supplier with this CNPJ already exists');
      }
    }

    // Validate email format if provided
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email format');
      }
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      throw new BadRequestError('Rating must be between 0 and 5');
    }

    // Create supplier
    const createdSupplier = await this.suppliersRepository.create({
      name: name.trim(),
      cnpj: supplierCNPJ,
      taxId,
      contact,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      country,
      paymentTerms,
      rating,
      isActive,
      notes,
    });

    return {
      supplier: {
        id: createdSupplier.id.toString(),
        name: createdSupplier.name,
        cnpj: createdSupplier.cnpj?.toString(),
        taxId: createdSupplier.taxId,
        contact: createdSupplier.contact,
        email: createdSupplier.email,
        phone: createdSupplier.phone,
        website: createdSupplier.website,
        address: createdSupplier.address,
        city: createdSupplier.city,
        state: createdSupplier.state,
        zipCode: createdSupplier.zipCode,
        country: createdSupplier.country,
        paymentTerms: createdSupplier.paymentTerms,
        rating: createdSupplier.rating,
        isActive: createdSupplier.isActive,
        notes: createdSupplier.notes,
        createdAt: createdSupplier.createdAt,
        updatedAt: createdSupplier.updatedAt,
      },
    };
  }
}
