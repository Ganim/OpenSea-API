import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';
import {
  type SupplierDTO,
  supplierToDTO,
} from '@/mappers/stock/supplier/supplier-to-dto';
import type { SuppliersRepository } from '@/repositories/stock/suppliers-repository';

interface UpdateSupplierUseCaseRequest {
  id: string;
  name?: string;
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

interface UpdateSupplierUseCaseResponse {
  supplier: SupplierDTO;
}

export class UpdateSupplierUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute({
    id,
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
  }: UpdateSupplierUseCaseRequest): Promise<UpdateSupplierUseCaseResponse> {
    // Check if supplier exists
    const supplier = await this.suppliersRepository.findById(
      new UniqueEntityID(id),
    );
    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    // Validate name if provided
    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError('Supplier name cannot be empty');
      }

      if (name.length > 200) {
        throw new BadRequestError(
          'Supplier name must be at most 200 characters',
        );
      }
    }

    // Validate and parse CNPJ if provided
    let supplierCNPJ: CNPJ | undefined;
    if (cnpj !== undefined) {
      if (cnpj.trim().length > 0) {
        const parsedCNPJ = CNPJ.create(cnpj);
        if (!parsedCNPJ) {
          throw new BadRequestError('Invalid CNPJ format');
        }
        supplierCNPJ = parsedCNPJ;

        // Check if CNPJ is already in use by another supplier
        const existingSupplier =
          await this.suppliersRepository.findByCNPJ(parsedCNPJ);
        if (existingSupplier && !existingSupplier.id.equals(supplier.id)) {
          throw new BadRequestError('A supplier with this CNPJ already exists');
        }
      }
    }

    // Validate email format if provided
    if (email !== undefined && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email format');
      }
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      throw new BadRequestError('Rating must be between 0 and 5');
    }

    // Update supplier
    const updatedSupplier = await this.suppliersRepository.update({
      id: new UniqueEntityID(id),
      name: name?.trim(),
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

    if (!updatedSupplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    return {
      supplier: supplierToDTO(updatedSupplier),
    };
  }
}
