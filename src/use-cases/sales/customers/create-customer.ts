import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import type { CustomerDTO } from '@/mappers/sales/customer/customer-to-dto';
import { customerToDTO } from '@/mappers/sales/customer/customer-to-dto';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface CreateCustomerUseCaseRequest {
  name: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
}

interface CreateCustomerUseCaseResponse {
  customer: CustomerDTO;
}

export class CreateCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute(
    input: CreateCustomerUseCaseRequest,
  ): Promise<CreateCustomerUseCaseResponse> {
    // Validation: name is required
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Customer name is required.');
    }

    // Validation: name max length 128
    if (input.name.length > 128) {
      throw new BadRequestError('Customer name cannot exceed 128 characters.');
    }

    // Validation: email format
    if (input.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new BadRequestError('Invalid email format.');
      }
      if (input.email.length > 254) {
        throw new BadRequestError('Email cannot exceed 254 characters.');
      }

      // Check if email already exists
      const existingCustomerWithEmail =
        await this.customersRepository.findByEmail(input.email);
      if (existingCustomerWithEmail) {
        throw new BadRequestError('Email already in use by another customer.');
      }
    }

    // Validation: phone max length 20
    if (input.phone && input.phone.length > 20) {
      throw new BadRequestError('Phone cannot exceed 20 characters.');
    }

    // Validation: state must be 2 characters if provided
    if (input.state && input.state.length !== 2) {
      throw new BadRequestError(
        'State must be exactly 2 characters (UF format).',
      );
    }

    // Validation: zipCode max length 10
    if (input.zipCode && input.zipCode.length > 10) {
      throw new BadRequestError('Zip code cannot exceed 10 characters.');
    }

    // Validation: country max length 64
    if (input.country && input.country.length > 64) {
      throw new BadRequestError('Country cannot exceed 64 characters.');
    }

    // Validation: address max length 256
    if (input.address && input.address.length > 256) {
      throw new BadRequestError('Address cannot exceed 256 characters.');
    }

    // Validation: city max length 128
    if (input.city && input.city.length > 128) {
      throw new BadRequestError('City cannot exceed 128 characters.');
    }

    // Validation and creation of document
    let document: Document | undefined;
    if (input.document) {
      try {
        document = Document.create(input.document);
      } catch (error) {
        throw new BadRequestError(
          error instanceof Error ? error.message : 'Invalid document format.',
        );
      }

      // Check if document already exists
      const existingCustomerWithDocument =
        await this.customersRepository.findByDocument(document);
      if (existingCustomerWithDocument) {
        throw new BadRequestError(
          'Document already in use by another customer.',
        );
      }
    }

    // Create customer
    const customer = await this.customersRepository.create({
      name: input.name.trim(),
      type: CustomerType.create(input.type),
      document,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state?.toUpperCase(),
      zipCode: input.zipCode,
      country: input.country,
      notes: input.notes,
      isActive: true,
    });

    return {
      customer: customerToDTO(customer),
    };
  }
}
