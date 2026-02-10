import { UniqueEntityID } from '@/entities/domain/unique-entity-id'
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { ListBankAccountsUseCase } from './list-bank-accounts'

let repository: InMemoryBankAccountsRepository
let sut: ListBankAccountsUseCase

describe('ListBankAccountsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryBankAccountsRepository()
    sut = new ListBankAccountsUseCase(repository)
  })

  it('should list bank accounts', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    })

    await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Poupança',
      bankCode: '001',
      agency: '1234',
      accountNumber: '54321-0',
      accountType: 'SAVINGS',
    })

    const result = await sut.execute({
      tenantId: 'tenant-1',
    })

    expect(result.bankAccounts).toHaveLength(2)
    expect(result.bankAccounts[0].name).toBe('Conta Principal')
    expect(result.bankAccounts[1].name).toBe('Conta Poupança')
  })

  it('should return empty array if no bank accounts', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
    })

    expect(result.bankAccounts).toHaveLength(0)
    expect(result.bankAccounts).toEqual([])
  })
})
