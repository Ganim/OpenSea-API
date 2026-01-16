import { Volume } from '@/entities/stock/volume';
import { VolumeItem } from '@/entities/stock/volume-item';
import type { PaginationParams } from '@/repositories/pagination-params';
import type { VolumeRepository } from '../volumes-repository';

export class InMemoryVolumesRepository implements VolumeRepository {
  public items: Volume[] = [];
  public volumeItems: VolumeItem[] = [];

  async create(volume: Volume): Promise<void> {
    this.items.push(volume);
  }

  async findById(id: string): Promise<Volume | null> {
    const volume = this.items.find(
      (item) => item.id.toString() === id && !item.deletedAt,
    );
    return volume ?? null;
  }

  async findByCode(code: string): Promise<Volume | null> {
    const volume = this.items.find(
      (item) => item.code === code && !item.deletedAt,
    );
    return volume ?? null;
  }

  async update(volume: Volume): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === volume.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = volume;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id);
    if (index !== -1) {
      const volume = this.items[index];
      volume.deletedAt = new Date();
    }
  }

  async list(
    params: PaginationParams,
  ): Promise<{ volumes: Volume[]; total: number }> {
    const filtered = this.items.filter((item) => !item.deletedAt);
    const total = filtered.length;
    const skip = ((params.page ?? 1) - 1) * (params.limit ?? 10);
    const take = params.limit ?? 10;
    const volumes = filtered.slice(skip, skip + take);
    return { volumes, total };
  }

  async addItem(volumeItem: VolumeItem): Promise<void> {
    this.volumeItems.push(volumeItem);
  }

  async removeItem(volumeId: string, itemId: string): Promise<void> {
    const index = this.volumeItems.findIndex(
      (item) => item.volumeId === volumeId && item.itemId === itemId,
    );
    if (index !== -1) {
      this.volumeItems.splice(index, 1);
    }
  }

  async getItemsByVolumeId(volumeId: string): Promise<VolumeItem[]> {
    return this.volumeItems.filter((item) => item.volumeId === volumeId);
  }

  async countItemsByVolumeId(volumeId: string): Promise<number> {
    return this.volumeItems.filter((item) => item.volumeId === volumeId).length;
  }
}
