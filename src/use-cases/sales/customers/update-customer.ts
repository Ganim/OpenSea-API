import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface UpdateCustomerUseCaseRequest {
  id: string;
  name?: string;
  type?: 'INDIVIDUAL' | 'BUSINESS';
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}

interface UpdateCustomerUseCaseResponse {
  customer: {
    id: string;
    name: string;
    type: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class UpdateCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute(
    input: UpdateCustomerUseCaseRequest,
  ): Promise<UpdateCustomerUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.id),
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    // Update name if provided
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Customer name cannot be empty.');
      }
      if (input.name.length > 128) {
        throw new BadRequestError(
          'Customer name cannot exceed 128 characters.',
        );
      }
      customer.name = input.name.trim();
    }

    // Update type if provided
    if (input.type !== undefined) {
      customer.type = CustomerType.create(input.type);
    }

    // Update document if provided
    if (input.document !== undefined) {
      if (input.document.trim().length > 0) {
        try {
          const document = Document.create(input.document);

          // Check if document already exists for another customer
          const existingCustomer =
            await this.customersRepository.findByDocument(document);
          if (existingCustomer && !existingCustomer.id.equals(customer.id)) {
            throw new BadRequestError(
              'Document already in use by another customer.',
            );
          }

          customer.document = document;
        } catch (error) {
          throw new BadRequestError(
            error instanceof Error ? error.message : 'Invalid document format.',
          );
        }
      } else {
        customer.document = undefined;
      }
    }

    // Update email if provided
    if (input.email !== undefined) {
      if (input.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email)) {
          throw new BadRequestError('Invalid email format.');
        }
        if (input.email.length > 254) {
          throw new BadRequestError('Email cannot exceed 254 characters.');
        }

        // Check if email already exists for another customer
        const existingCustomer = await this.customersRepository.findByEmail(
          input.email,
        );
        if (existingCustomer && !existingCustomer.id.equals(customer.id)) {
          throw new BadRequestError(
            'Email already in use by another customer.',
          );
        }

        customer.email = input.email;
      } else {
        customer.email = undefined;
      }
    }

    // Update phone if provided
    if (input.phone !== undefined) {
      if (input.phone.length > 20) {
        throw new BadRequestError('Phone cannot exceed 20 characters.');
      }
      customer.phone = input.phone.trim().length > 0 ? input.phone : undefined;
    }

    // Update address if provided
    if (input.address !== undefined) {
      if (input.address.length > 256) {
        throw new BadRequestError('Address cannot exceed 256 characters.');
      }
      customer.address =
        input.address.trim().length > 0 ? input.address : undefined;
    }

    // Update city if provided
    if (input.city !== undefined) {
      if (input.city.length > 128) {
        throw new BadRequestError('City cannot exceed 128 characters.');
      }
      customer.city = input.city.trim().length > 0 ? input.city : undefined;
    }

    // Update state if provided
    if (input.state !== undefined) {
      if (input.state.trim().length > 0) {
        if (input.state.length !== 2) {
          throw new BadRequestError(
            'State must be exactly 2 characters (UF format).',
          );
        }
        customer.state = input.state.toUpperCase();
      } else {
        customer.state = undefined;
      }
    }

    // Update zipCode if provided
    if (input.zipCode !== undefined) {
      if (input.zipCode.length > 10) {
        throw new BadRequestError('Zip code cannot exceed 10 characters.');
      }
      customer.zipCode =
        input.zipCode.trim().length > 0 ? input.zipCode : undefined;
    }

    // Update country if provided
    if (input.country !== undefined) {
      if (input.country.length > 64) {
        throw new BadRequestError('Country cannot exceed 64 characters.');
      }
      customer.country =
        input.country.trim().length > 0 ? input.country : undefined;
    }

    // Update notes if provided
    if (input.notes !== undefined) {
      customer.notes = input.notes.trim().length > 0 ? input.notes : undefined;
    }

    // Update isActive if provided
    if (input.isActive !== undefined) {
      customer.isActive = input.isActive;
    }

    await this.customersRepository.save(customer);

    return {
      customer: {
        id: customer.id.toString(),
        name: customer.name,
        type: customer.type.value,
        document: customer.document?.value ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        address: customer.address ?? null,
        city: customer.city ?? null,
        state: customer.state ?? null,
        zipCode: customer.zipCode ?? null,
        country: customer.country ?? null,
        notes: customer.notes ?? null,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt ?? customer.createdAt,
      },
    };
  }
}
