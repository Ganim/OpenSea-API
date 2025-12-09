import type { Tag } from '@/entities/stock/tag';

export interface TagDTO {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function tagToDTO(tag: Tag): TagDTO {
  return {
    id: tag.tagId.toString(),
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    description: tag.description,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}
