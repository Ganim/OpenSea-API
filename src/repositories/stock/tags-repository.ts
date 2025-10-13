import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Tag } from '@/entities/stock/tag';

export interface CreateTagSchema {
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

export interface UpdateTagSchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  color?: string;
  description?: string;
}

export interface TagsRepository {
  create(data: CreateTagSchema): Promise<Tag>;
  findById(id: UniqueEntityID): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  findMany(): Promise<Tag[]>;
  findManyByNames(names: string[]): Promise<Tag[]>;
  update(data: UpdateTagSchema): Promise<Tag | null>;
  save(tag: Tag): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
