import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBankAccountUseCase } from './create-bank-account';

let repository: InMemoryBankAccountsRepository;
let sut: CreateBankAccountUseCase;

describe('CreateBankAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryBankAccountsRepository();
    sut = new CreateBankAccountUseCase(repository);
  });

  it('should create a bank account', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    expect(result.bankAccount).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Conta Principal',
        bankCode: '001',
        accountType: 'CHECKING',
        status: 'ACTIVE',
        isDefault: false,
      }),
    );
  });

  it('should create with all fields', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta PIX',
      bankCode: '260',
      bankName: 'Nubank',
      agency: '0001',
      accountNumber: '999999',
      accountType: 'DIGITAL',
      pixKeyType: 'CPF',
      pixKey: '12345678901',
      color: '#8A2BE2',
      isDefault: true,
    });

    expect(result.bankAccount.bankName).toBe('Nubank');
    expect(result.bankAccount.pixKeyType).toBe('CPF');
    expect(result.bankAccount.isDefault).toBe(true);
  });

  it('should not create with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        companyId: 'company-1',
        name: '',
        bankCode: '001',
        agency: '1234',
        accountNumber: '12345-6',
        accountType: 'CHECKING',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with empty bank code', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        companyId: 'company-1',
        name: 'Conta',
        bankCode: '',
        agency: '1234',
        accountNumber: '12345-6',
        accountType: 'CHECKING',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with empty agency', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        companyId: 'company-1',
        name: 'Conta',
        bankCode: '001',
        agency: '',
        accountNumber: '12345-6',
        accountType: 'CHECKING',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
