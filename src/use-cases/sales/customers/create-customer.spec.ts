import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCustomerUseCase } from './create-customer';

let customersRepository: InMemoryCustomersRepository;
let createCustomer: CreateCustomerUseCase;

describe('CreateCustomerUseCase', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository();
    createCustomer = new CreateCustomerUseCase(customersRepository);
  });

  it('should be able to create an individual customer', async () => {
    const result = await createCustomer.execute({
      name: 'João Silva',
      type: 'INDIVIDUAL',
      document: '52998224725', // CPF válido
      email: 'joao@example.com',
      phone: '11987654321',
    });

    expect(result.customer).toBeDefined();
    expect(result.customer.name).toBe('João Silva');
    expect(result.customer.type).toBe('INDIVIDUAL');
    expect(result.customer.document).toBe('52998224725');
    expect(result.customer.email).toBe('joao@example.com');
    expect(result.customer.isActive).toBe(true);
  });

  it('should be able to create a company customer', async () => {
    const result = await createCustomer.execute({
      name: 'Empresa LTDA',
      type: 'BUSINESS',
      document: '11222333000181', // CNPJ válido
      email: 'contato@empresa.com',
    });

    expect(result.customer.name).toBe('Empresa LTDA');
    expect(result.customer.type).toBe('BUSINESS');
    expect(result.customer.document).toBe('11222333000181');
  });

  it('should be able to create customer with full address', async () => {
    const result = await createCustomer.execute({
      name: 'Cliente Completo',
      type: 'INDIVIDUAL',
      address: 'Rua Exemplo, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
    });

    expect(result.customer.address).toBe('Rua Exemplo, 123');
    expect(result.customer.city).toBe('São Paulo');
    expect(result.customer.state).toBe('SP');
    expect(result.customer.zipCode).toBe('01234-567');
    expect(result.customer.country).toBe('Brasil');
  });

  it('should be able to create customer without document', async () => {
    const result = await createCustomer.execute({
      name: 'Cliente Sem Documento',
      type: 'INDIVIDUAL',
      email: 'sem.documento@example.com',
    });

    expect(result.customer.document).toBeUndefined();
    expect(result.customer.name).toBe('Cliente Sem Documento');
  });

  it('should be able to create customer with notes', async () => {
    const result = await createCustomer.execute({
      name: 'Cliente Com Notas',
      type: 'INDIVIDUAL',
      notes: 'Cliente VIP - desconto especial',
    });

    expect(result.customer.notes).toBe('Cliente VIP - desconto especial');
  });

  it('should not allow empty name', async () => {
    await expect(() =>
      createCustomer.execute({
        name: '',
        type: 'INDIVIDUAL',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      createCustomer.execute({
        name: '   ',
        type: 'INDIVIDUAL',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow name exceeding 128 characters', async () => {
    await expect(() =>
      createCustomer.execute({
        name: 'A'.repeat(129),
        type: 'INDIVIDUAL',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid email format', async () => {
    await expect(() =>
      createCustomer.execute({
        name: 'Cliente',
        type: 'INDIVIDUAL',
        email: 'invalid-email',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      createCustomer.execute({
        name: 'Cliente',
        type: 'INDIVIDUAL',
        email: 'no-at-sign.com',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate email', async () => {
    await createCustomer.execute({
      name: 'Cliente 1',
      type: 'INDIVIDUAL',
      email: 'duplicate@example.com',
    });

    await expect(() =>
      createCustomer.execute({
        name: 'Cliente 2',
        type: 'INDIVIDUAL',
        email: 'duplicate@example.com',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate document', async () => {
    await createCustomer.execute({
      name: 'Cliente 1',
      type: 'INDIVIDUAL',
      document: '52998224725', // CPF válido
    });

    await expect(() =>
      createCustomer.execute({
        name: 'Cliente 2',
        type: 'INDIVIDUAL',
        document: '52998224725',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid document format', async () => {
    await expect(() =>
      createCustomer.execute({
        name: 'Cliente',
        type: 'INDIVIDUAL',
        document: 'INVALID',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow state with invalid length', async () => {
    await expect(() =>
      createCustomer.execute({
        name: 'Cliente',
        type: 'INDIVIDUAL',
        state: 'SAO',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      createCustomer.execute({
        name: 'Cliente',
        type: 'INDIVIDUAL',
        state: 'S',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should convert state to uppercase', async () => {
    const result = await createCustomer.execute({
      name: 'Cliente',
      type: 'INDIVIDUAL',
      state: 'sp',
    });

    expect(result.customer.state).toBe('SP');
  });

  it('should trim customer name', async () => {
    const result = await createCustomer.execute({
      name: '  Cliente Com Espaços  ',
      type: 'INDIVIDUAL',
    });

    expect(result.customer.name).toBe('Cliente Com Espaços');
  });
});
