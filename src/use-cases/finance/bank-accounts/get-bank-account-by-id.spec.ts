import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found'
import { UniqueEntityID } from '@/entities/domain/unique-entity-id'
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { GetBankAccountByIdUseCase } from './get-bank-account-by-id'

let repository: InMemoryBankAccountsRepository
let sut: GetBankAccountByIdUseCase

describe('GetBankAccountByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryBankAccountsRepository()
    sut = new GetBankAccountByIdUseCase(repository)
  })

  it('should get a bank account by id', async () => {
    const bankAccount = await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    })

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: bankAccount.id.toString(),
    })

    expect(result.bankAccount).toBeDefined()
    expect(result.bankAccount.id).toBe(bankAccount.id.toString())
    expect(result.bankAccount.name).toBe('Conta Principal')
    expect(result.bankAccount.bankCode).toBe('001')
    expect(result.bankAccount.agency).toBe('1234')
    expect(result.bankAccount.accountNumber).toBe('12345-6')
    expect(result.bankAccount.accountType).toBe('CHECKING')
  })

  it('should throw ResourceNotFoundError if not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
