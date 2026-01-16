import { prisma } from '@/lib/prisma'
import { Volume } from '@/entities/stock/volume'
import { VolumeItem } from '@/entities/stock/volume-item'
import { VolumeMapper, VolumeItemMapper } from '@/mappers/stock/volume.mapper'
import type { VolumeRepository } from '../volumes-repository'
import type { PaginationParams } from '@/repositories/pagination-params'
import type { Volume as PrismaVolume, VolumeItem as PrismaVolumeItem } from '@prisma/client'

export class PrismaVolumesRepository implements VolumeRepository {
  async create(volume: Volume): Promise<void> {
    const data = VolumeMapper.toPersistence(volume)
    await prisma.volume.create({ data })
  }

  async findById(id: string): Promise<Volume | null> {
    const volume = await prisma.volume.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!volume) {
      return null
    }

    return VolumeMapper.toDomain(volume)
  }

  async findByCode(code: string): Promise<Volume | null> {
    const volume = await prisma.volume.findFirst({
      where: {
        code,
        deletedAt: null,
      },
    })

    if (!volume) {
      return null
    }

    return VolumeMapper.toDomain(volume)
  }

  async update(volume: Volume): Promise<void> {
    const data = VolumeMapper.toPersistence(volume)
    await prisma.volume.update({
      where: {
        id: volume.id.toString(),
      },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.volume.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  async list(params: PaginationParams): Promise<{ volumes: Volume[]; total: number }> {
    const [volumes, total] = await Promise.all([
      prisma.volume.findMany({
        where: {
          deletedAt: null,
        },
        skip: ((params.page ?? 1) - 1) * (params.limit ?? 10),
        take: params.limit ?? 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.volume.count({
        where: {
          deletedAt: null,
        },
      }),
    ])

    return {
      volumes: volumes.map((volume: PrismaVolume) => VolumeMapper.toDomain(volume)),
      total,
    }
  }

  async addItem(volumeItem: VolumeItem): Promise<void> {
    const data = VolumeItemMapper.toPersistence(volumeItem)
    await prisma.volumeItem.create({ data })
  }

  async removeItem(volumeId: string, itemId: string): Promise<void> {
    await prisma.volumeItem.deleteMany({
      where: {
        volumeId,
        itemId,
      },
    })
  }

  async getItemsByVolumeId(volumeId: string): Promise<VolumeItem[]> {
    const items = await prisma.volumeItem.findMany({
      where: {
        volumeId,
      },
    })

    return items.map((item: PrismaVolumeItem) => VolumeItemMapper.toDomain(item))
  }

  async countItemsByVolumeId(volumeId: string): Promise<number> {
    return prisma.volumeItem.count({
      where: {
        volumeId,
      },
    })
  }
}
