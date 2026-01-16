import { BadRequestError } from '@/@errors/use-cases/bad-request-error'
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status'
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateVolumeUseCase } from './create-volume'

describe('CreateVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository
  let sut: CreateVolumeUseCase

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository()
    sut = new CreateVolumeUseCase(volumesRepository)
  })

  it('should create a new volume with auto-generated code', async () => {
    const result = await sut.execute({
      name: 'Volume 1',
      createdBy: 'user-1',
    })

    expect(result.volume).toBeDefined()
    expect(result.volume.code).toMatch(/^VOL-\d{4}-\d+[A-Z0-9]+$/)
    expect(result.volume.name).toBe('Volume 1')
    expect(result.volume.status).toBe(VolumeStatus.OPEN)
  })

  it('should create volume with default OPEN status', async () => {
    const result = await sut.execute({
      name: 'Volume Default Status',
      createdBy: 'user-1',
    })

    expect(result.volume.status).toBe(VolumeStatus.OPEN)
  })

  it('should create volume with custom status', async () => {
    const result = await sut.execute({
      name: 'Volume 2',
      createdBy: 'user-1',
      status: VolumeStatus.CLOSED,
    })

    expect(result.volume.status).toBe(VolumeStatus.CLOSED)
  })

  it('should throw error if status is invalid', async () => {
    await expect(
      sut.execute({
        name: 'Volume 3',
        createdBy: 'user-1',
        status: 'INVALID' as any,
      }),
    ).rejects.toThrow(BadRequestError)
  })

  it('should include all optional fields when provided', async () => {
    const result = await sut.execute({
      name: 'Volume with Details',
      notes: 'Test notes',
      destinationRef: 'REF-001',
      salesOrderId: 'order-1',
      customerId: 'customer-1',
      createdBy: 'user-1',
    })

    expect(result.volume.notes).toBe('Test notes')
    expect(result.volume.destinationRef).toBe('REF-001')
    expect(result.volume.salesOrderId).toBe('order-1')
    expect(result.volume.customerId).toBe('customer-1')
  })

  it('should create volume without optional name', async () => {
    const result = await sut.execute({
      createdBy: 'user-1',
    })

    expect(result.volume).toBeDefined()
    expect(result.volume.code).toMatch(/^VOL-\d{4}-\d+[A-Z0-9]+$/)
    expect(result.volume.name).toBeNull()
  })

  it('should generate unique codes for multiple volumes', async () => {
    const result1 = await sut.execute({
      name: 'Volume A',
      createdBy: 'user-1',
    })

    const result2 = await sut.execute({
      name: 'Volume B',
      createdBy: 'user-1',
    })

    expect(result1.volume.code).not.toBe(result2.volume.code)
  })

  it('should set createdAt and updatedAt timestamps', async () => {
    const beforeCreate = new Date()

    const result = await sut.execute({
      name: 'Volume with Timestamps',
      createdBy: 'user-1',
    })

    const afterCreate = new Date()

    expect(new Date(result.volume.createdAt).getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime(),
    )
    expect(new Date(result.volume.createdAt).getTime()).toBeLessThanOrEqual(
      afterCreate.getTime(),
    )
    expect(new Date(result.volume.updatedAt).getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime(),
    )
  })
})
