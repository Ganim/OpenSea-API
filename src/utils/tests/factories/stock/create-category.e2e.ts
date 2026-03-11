import { prisma } from '@/lib/prisma';

interface CreateCategoryProps {
  tenantId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  parentId?: string;
  displayOrder?: number;
}

function generateSlug(name: string, suffix: string): string {
  return (
    name
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/_/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${suffix}`
  );
}

/**
 * Creates a category directly in the database for E2E tests.
 *
 * @example
 * const { category, categoryId } = await createCategory({ tenantId });
 */
export async function createCategory(override: CreateCategoryProps) {
  const timestamp = Date.now();
  const name = override.name ?? `Test Category ${timestamp}`;
  const slug = generateSlug(name, String(timestamp).slice(-6));

  const category = await prisma.category.create({
    data: {
      tenantId: override.tenantId,
      name,
      slug,
      description: override.description,
      displayOrder: override.displayOrder ?? 1,
      isActive: override.isActive ?? true,
      parentId: override.parentId,
    },
  });

  return {
    category,
    categoryId: category.id,
  };
}
