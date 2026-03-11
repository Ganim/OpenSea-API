import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

const PT_BR_TRANSLITERATION: Record<string, string> = {
  á: 'a',
  à: 'a',
  â: 'a',
  ã: 'a',
  ä: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ó: 'o',
  ò: 'o',
  ô: 'o',
  õ: 'o',
  ö: 'o',
  ú: 'u',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ç: 'c',
  ñ: 'n',
};

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, (char) => PT_BR_TRANSLITERATION[char] ?? '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface SeedCategory {
  name: string;
  type: 'REVENUE' | 'EXPENSE';
  displayOrder: number;
  children?: Array<{
    name: string;
    type: 'REVENUE' | 'EXPENSE';
    displayOrder: number;
  }>;
}

/**
 * Default DRE (Demonstracao do Resultado do Exercicio) category structure.
 * Based on Brazilian accounting standards.
 */
const DRE_STRUCTURE: SeedCategory[] = [
  // REVENUE tree
  {
    name: 'Receita Operacional Bruta',
    type: 'REVENUE',
    displayOrder: 100,
    children: [
      { name: 'Vendas de Produtos', type: 'REVENUE', displayOrder: 110 },
      { name: 'Prestacao de Servicos', type: 'REVENUE', displayOrder: 120 },
    ],
  },
  {
    name: 'Deducoes da Receita',
    type: 'REVENUE',
    displayOrder: 200,
    children: [
      { name: 'Impostos sobre Vendas', type: 'REVENUE', displayOrder: 210 },
      { name: 'Devolucoes e Abatimentos', type: 'REVENUE', displayOrder: 220 },
    ],
  },

  // EXPENSE tree
  {
    name: 'Custos dos Produtos e Servicos',
    type: 'EXPENSE',
    displayOrder: 300,
    children: [
      {
        name: 'Custo de Mercadorias Vendidas',
        type: 'EXPENSE',
        displayOrder: 310,
      },
      {
        name: 'Custo de Servicos Prestados',
        type: 'EXPENSE',
        displayOrder: 320,
      },
    ],
  },
  {
    name: 'Despesas Operacionais',
    type: 'EXPENSE',
    displayOrder: 400,
    children: [
      { name: 'Pessoal', type: 'EXPENSE', displayOrder: 410 },
      { name: 'Administrativas', type: 'EXPENSE', displayOrder: 420 },
      { name: 'Comerciais', type: 'EXPENSE', displayOrder: 430 },
    ],
  },
  {
    name: 'Despesas Financeiras',
    type: 'EXPENSE',
    displayOrder: 500,
    children: [
      { name: 'Juros e Multas', type: 'EXPENSE', displayOrder: 510 },
      { name: 'Tarifas Bancarias', type: 'EXPENSE', displayOrder: 520 },
    ],
  },
  {
    name: 'Receitas Financeiras',
    type: 'REVENUE',
    displayOrder: 600,
    children: [
      { name: 'Rendimentos de Aplicacao', type: 'REVENUE', displayOrder: 610 },
    ],
  },
  {
    name: 'Resultado Nao Operacional',
    type: 'EXPENSE',
    displayOrder: 700,
    children: [
      { name: 'Receitas Nao Operacionais', type: 'REVENUE', displayOrder: 710 },
      { name: 'Despesas Nao Operacionais', type: 'EXPENSE', displayOrder: 720 },
    ],
  },
];

interface SeedFinanceCategoriesUseCaseRequest {
  tenantId: string;
}

interface SeedFinanceCategoriesUseCaseResponse {
  created: number;
  skipped: boolean;
}

export class SeedFinanceCategoriesUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute({
    tenantId,
  }: SeedFinanceCategoriesUseCaseRequest): Promise<SeedFinanceCategoriesUseCaseResponse> {
    // Idempotency: check if system categories already exist for this tenant
    const existing = await this.categoriesRepository.findMany(tenantId);
    const hasSystemCategories = existing.some((c) => c.isSystem);

    if (hasSystemCategories) {
      return { created: 0, skipped: true };
    }

    let created = 0;

    for (const root of DRE_STRUCTURE) {
      const rootSlug = slugify(root.name);

      const rootCategory = await this.categoriesRepository.create({
        tenantId,
        name: root.name,
        slug: rootSlug,
        type: root.type,
        displayOrder: root.displayOrder,
        isSystem: true,
        isActive: true,
      });

      created++;

      if (root.children) {
        for (const child of root.children) {
          const childSlug = slugify(child.name);

          await this.categoriesRepository.create({
            tenantId,
            name: child.name,
            slug: childSlug,
            type: child.type,
            displayOrder: child.displayOrder,
            parentId: rootCategory.id.toString(),
            isSystem: true,
            isActive: true,
          });

          created++;
        }
      }
    }

    return { created, skipped: false };
  }
}
