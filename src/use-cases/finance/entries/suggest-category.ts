import type {
  FinanceEntriesRepository,
  CategoryFrequency,
} from '@/repositories/finance/finance-entries-repository';

interface SuggestCategoryUseCaseRequest {
  tenantId: string;
  supplierName?: string;
  description?: string;
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
}

export interface SuggestCategoryUseCaseResponse {
  suggestions: CategorySuggestion[];
}

export class SuggestCategoryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: SuggestCategoryUseCaseRequest,
  ): Promise<SuggestCategoryUseCaseResponse> {
    const { tenantId, supplierName, description } = request;

    if (!supplierName && !description) {
      return { suggestions: [] };
    }

    const supplierFrequencies: CategoryFrequency[] = supplierName
      ? await this.financeEntriesRepository.findCategoryFrequencyBySupplier(
          tenantId,
          supplierName,
        )
      : [];

    const keywordFrequencies: CategoryFrequency[] = description
      ? await this.financeEntriesRepository.findCategoryFrequencyByKeywords(
          tenantId,
          this.extractKeywords(description),
        )
      : [];

    const suggestions = this.buildSuggestions(
      supplierFrequencies,
      keywordFrequencies,
    );

    return { suggestions };
  }

  private buildSuggestions(
    supplierFrequencies: CategoryFrequency[],
    keywordFrequencies: CategoryFrequency[],
  ): CategorySuggestion[] {
    const suggestionMap = new Map<string, CategorySuggestion>();

    const totalSupplierEntries = supplierFrequencies.reduce(
      (sum, freq) => sum + freq.count,
      0,
    );

    // Process supplier-based frequencies (primary signal)
    for (const frequency of supplierFrequencies) {
      const dominanceRatio =
        totalSupplierEntries > 0 ? frequency.count / totalSupplierEntries : 0;

      const confidence = this.calculateSupplierConfidence(
        frequency.count,
        dominanceRatio,
      );

      const reason = this.buildSupplierReason(frequency.count, dominanceRatio);

      suggestionMap.set(frequency.categoryId, {
        categoryId: frequency.categoryId,
        categoryName: frequency.categoryName,
        confidence,
        reason,
      });
    }

    // Process keyword-based frequencies (secondary signal, boost or add)
    for (const frequency of keywordFrequencies) {
      const existingSuggestion = suggestionMap.get(frequency.categoryId);

      if (existingSuggestion) {
        // Boost confidence by up to 5 points when keywords also match
        const keywordBoost = Math.min(frequency.count * 2, 5);
        existingSuggestion.confidence = Math.min(
          existingSuggestion.confidence + keywordBoost,
          100,
        );
        existingSuggestion.reason += '; descrição também corresponde';
      } else {
        const confidence = this.calculateKeywordConfidence(frequency.count);
        suggestionMap.set(frequency.categoryId, {
          categoryId: frequency.categoryId,
          categoryName: frequency.categoryName,
          confidence,
          reason: `${frequency.count} lançamento(s) com palavras-chave similares na descrição`,
        });
      }
    }

    return Array.from(suggestionMap.values())
      .sort(
        (suggestionA, suggestionB) =>
          suggestionB.confidence - suggestionA.confidence,
      )
      .slice(0, 3);
  }

  private calculateSupplierConfidence(
    entryCount: number,
    dominanceRatio: number,
  ): number {
    if (entryCount >= 5 && dominanceRatio >= 0.7) return 95;
    if (entryCount >= 5) return 85;
    if (entryCount >= 3) return 80;
    if (entryCount >= 1) return 60;
    return 30;
  }

  private calculateKeywordConfidence(matchCount: number): number {
    if (matchCount >= 5) return 70;
    if (matchCount >= 3) return 55;
    if (matchCount >= 1) return 40;
    return 20;
  }

  private buildSupplierReason(
    entryCount: number,
    dominanceRatio: number,
  ): string {
    const percentageText = `${Math.round(dominanceRatio * 100)}%`;

    if (entryCount >= 5 && dominanceRatio >= 0.7) {
      return `${entryCount} lançamentos deste fornecedor usam esta categoria (${percentageText} do total)`;
    }
    if (entryCount >= 3) {
      return `${entryCount} lançamentos deste fornecedor usam esta categoria`;
    }
    return `${entryCount} lançamento(s) deste fornecedor nesta categoria`;
  }

  private extractKeywords(description: string): string[] {
    const stopWords = new Set([
      'de',
      'da',
      'do',
      'das',
      'dos',
      'em',
      'no',
      'na',
      'nos',
      'nas',
      'para',
      'por',
      'com',
      'sem',
      'um',
      'uma',
      'uns',
      'umas',
      'o',
      'a',
      'os',
      'as',
      'e',
      'ou',
      'que',
      'ref',
      'nf',
      'nota',
      'fiscal',
    ]);

    return description
      .toLowerCase()
      .split(/[\s,;.\-/\\()]+/)
      .filter((word) => word.length >= 3 && !stopWords.has(word));
  }
}
