import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';
import { truncateContent } from '@/services/ai-documents/pdf-extractor';
import { makeListProductsUseCase } from '@/use-cases/stock/products/factories/make-list-products-use-case';
import { makeListItemsUseCase } from '@/use-cases/stock/items/factories/make-list-items-use-case';

// ─── Interfaces ──────────────────────────────────────────────────────

export interface DocumentAnalysisRequest {
  tenantId: string;
  userId: string;
  userPermissions: string[];
  content: string;
  documentType?: 'EDITAL' | 'LICITACAO' | 'PREGAO' | 'COTACAO' | 'OTHER';
}

export interface ExtractedItem {
  itemNumber: number;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
  estimatedUnitPrice?: number;
}

export interface ItemMatch {
  extractedItem: ExtractedItem;
  product: {
    id: string;
    name: string;
    currentStock: number;
    price: number;
  };
  matchConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  stockSufficient: boolean;
  deficit?: number;
}

export interface SuggestedAction {
  type:
    | 'CREATE_PURCHASE_ORDER'
    | 'SCHEDULE_REMINDER'
    | 'GENERATE_PROPOSAL'
    | 'ALERT_LOW_STOCK';
  description: string;
  tool?: string;
  args?: Record<string, unknown>;
}

export interface DocumentAnalysisResult {
  documentInfo: {
    type: string;
    title: string;
    organization: string;
    openingDate?: string;
    deliveryDeadline?: string;
    estimatedValue?: number;
    requirements: string[];
  };
  items: ExtractedItem[];
  stockMatch: {
    totalItems: number;
    matchedItems: number;
    matchPercentage: number;
    matches: ItemMatch[];
    missing: ExtractedItem[];
  };
  suggestedActions: SuggestedAction[];
  summary: string;
}

// ─── AI Extraction Prompt ────────────────────────────────────────────

function buildExtractionPrompt(
  content: string,
  documentType?: string,
): AiProviderMessage[] {
  const typeHint = documentType
    ? `O tipo do documento é: ${documentType}.`
    : 'Identifique o tipo do documento automaticamente.';

  return [
    {
      role: 'system',
      content: `Você é um assistente especializado em análise de documentos de licitações, editais, pregões e cotações do governo brasileiro.

Sua tarefa é extrair informações estruturadas do documento fornecido e retornar EXCLUSIVAMENTE um JSON válido, sem nenhum texto adicional, sem markdown, sem code blocks.

${typeHint}

O JSON deve seguir exatamente esta estrutura:
{
  "documentInfo": {
    "type": "EDITAL|LICITACAO|PREGAO|COTACAO|OTHER",
    "title": "título do documento",
    "organization": "órgão/empresa responsável",
    "openingDate": "data de abertura (formato YYYY-MM-DD ou null)",
    "deliveryDeadline": "prazo de entrega (formato YYYY-MM-DD ou null)",
    "estimatedValue": 0.00,
    "requirements": ["requisito 1", "requisito 2"]
  },
  "items": [
    {
      "itemNumber": 1,
      "description": "descrição do item",
      "quantity": 10,
      "unit": "UN|KG|M|L|CX|PCT|etc",
      "specifications": "especificações técnicas ou null",
      "estimatedUnitPrice": 0.00
    }
  ]
}

Regras:
- Extraia TODOS os itens listados no documento
- Se a quantidade não estiver clara, use 1
- Se a unidade não estiver clara, use "UN"
- Se o preço estimado não existir, omita o campo estimatedUnitPrice
- Os requisitos devem incluir: habilitação, documentação necessária, qualificações técnicas
- Retorne SOMENTE o JSON, sem nenhuma explicação ou formatação adicional`,
    },
    {
      role: 'user',
      content: `Analise o seguinte documento e extraia as informações estruturadas:\n\n${content}`,
    },
  ];
}

// ─── Use Case ────────────────────────────────────────────────────────

export class AnalyzeDocumentUseCase {
  constructor(private aiRouter: AiRouter) {}

  async execute(
    request: DocumentAnalysisRequest,
  ): Promise<DocumentAnalysisResult> {
    const content = truncateContent(request.content);

    // Step 1: Extract structured data from document via AI (Tier 3)
    const extractionMessages = buildExtractionPrompt(
      content,
      request.documentType,
    );
    const aiResponse = await this.aiRouter.complete(extractionMessages, 3, {
      temperature: 0.1,
      maxTokens: 4000,
    });

    const extracted = this.parseAiResponse(aiResponse.content);

    // Step 2: Cross-reference extracted items with stock
    const stockMatch = await this.crossReferenceWithStock(
      extracted.items,
      request.tenantId,
    );

    // Step 3: Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(
      extracted,
      stockMatch,
    );

    // Step 4: Generate summary
    const summary = this.generateSummary(extracted, stockMatch);

    return {
      documentInfo: extracted.documentInfo,
      items: extracted.items,
      stockMatch,
      suggestedActions,
      summary,
    };
  }

  /**
   * Parse AI response, stripping markdown code blocks if present.
   */
  private parseAiResponse(content: string): {
    documentInfo: DocumentAnalysisResult['documentInfo'];
    items: ExtractedItem[];
  } {
    let cleaned = content.trim();

    // Strip markdown code fences if the AI included them
    if (cleaned.startsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned);

      const documentInfo = {
        type: parsed.documentInfo?.type ?? 'OTHER',
        title: parsed.documentInfo?.title ?? 'Documento sem título',
        organization: parsed.documentInfo?.organization ?? 'Não identificado',
        openingDate: parsed.documentInfo?.openingDate ?? undefined,
        deliveryDeadline: parsed.documentInfo?.deliveryDeadline ?? undefined,
        estimatedValue:
          typeof parsed.documentInfo?.estimatedValue === 'number'
            ? parsed.documentInfo.estimatedValue
            : undefined,
        requirements: Array.isArray(parsed.documentInfo?.requirements)
          ? parsed.documentInfo.requirements
          : [],
      };

      const items: ExtractedItem[] = Array.isArray(parsed.items)
        ? parsed.items.map((item: Record<string, unknown>, index: number) => ({
            itemNumber:
              typeof item.itemNumber === 'number' ? item.itemNumber : index + 1,
            description: String(item.description ?? ''),
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            unit: String(item.unit ?? 'UN'),
            specifications: item.specifications
              ? String(item.specifications)
              : undefined,
            estimatedUnitPrice:
              typeof item.estimatedUnitPrice === 'number'
                ? item.estimatedUnitPrice
                : undefined,
          }))
        : [];

      return { documentInfo, items };
    } catch {
      throw new Error(
        'Falha ao interpretar a resposta da IA. O documento pode estar em formato não suportado.',
      );
    }
  }

  /**
   * Search for each extracted item in the tenant's stock.
   */
  private async crossReferenceWithStock(
    items: ExtractedItem[],
    tenantId: string,
  ): Promise<DocumentAnalysisResult['stockMatch']> {
    const matches: ItemMatch[] = [];
    const missing: ExtractedItem[] = [];

    const listProductsUseCase = makeListProductsUseCase();
    const listItemsUseCase = makeListItemsUseCase();

    for (const extractedItem of items) {
      // Build search terms: use first 3 significant words from description
      const searchTerms = extractedItem.description
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 3)
        .join(' ');

      if (!searchTerms) {
        missing.push(extractedItem);
        continue;
      }

      try {
        const productResult = await listProductsUseCase.execute({
          tenantId,
          search: searchTerms,
          page: 1,
          limit: 5,
        });

        if (productResult.products.length === 0) {
          missing.push(extractedItem);
          continue;
        }

        // Pick the best match (first result from search)
        const bestProduct = productResult.products[0];

        // Get current stock for this product
        let currentStock = 0;
        let unitPrice = 0;

        try {
          const itemsResult = await listItemsUseCase.execute({
            tenantId,
            productId: bestProduct.id.toString(),
            page: 1,
            limit: 1,
          });

          if (itemsResult.items.length > 0) {
            currentStock = itemsResult.items[0].currentQuantity ?? 0;
            unitPrice = itemsResult.items[0].unitCost
              ? Number(itemsResult.items[0].unitCost)
              : 0;
          }
        } catch {
          // Stock query failed — proceed with zero stock
        }

        // Determine match confidence based on search quality
        const descLower = extractedItem.description.toLowerCase();
        const nameLower = bestProduct.name.toLowerCase();
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

        if (nameLower === descLower || descLower.includes(nameLower)) {
          confidence = 'HIGH';
        } else {
          const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 2);
          const matchingWords = nameWords.filter((w) => descLower.includes(w));
          if (matchingWords.length >= Math.ceil(nameWords.length * 0.6)) {
            confidence = 'MEDIUM';
          }
        }

        const stockSufficient = currentStock >= extractedItem.quantity;
        const deficit = stockSufficient
          ? undefined
          : extractedItem.quantity - currentStock;

        matches.push({
          extractedItem,
          product: {
            id: bestProduct.id.toString(),
            name: bestProduct.name,
            currentStock,
            price: unitPrice,
          },
          matchConfidence: confidence,
          stockSufficient,
          deficit,
        });
      } catch {
        missing.push(extractedItem);
      }
    }

    const totalItems = items.length;
    const matchedItems = matches.length;
    const matchPercentage =
      totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      matchedItems,
      matchPercentage,
      matches,
      missing,
    };
  }

  /**
   * Generate actionable suggestions based on the analysis.
   */
  private generateSuggestedActions(
    extracted: {
      documentInfo: DocumentAnalysisResult['documentInfo'];
      items: ExtractedItem[];
    },
    stockMatch: DocumentAnalysisResult['stockMatch'],
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Suggest purchase orders for items with stock deficit
    const deficitItems = stockMatch.matches.filter((m) => !m.stockSufficient);
    if (deficitItems.length > 0) {
      actions.push({
        type: 'CREATE_PURCHASE_ORDER',
        description: `Criar pedido de compra para ${deficitItems.length} item(ns) com estoque insuficiente`,
        tool: 'stock_create_purchase_order',
        args: {
          items: deficitItems.map((m) => ({
            productId: m.product.id,
            productName: m.product.name,
            quantity: m.deficit ?? m.extractedItem.quantity,
          })),
        },
      });
    }

    // Alert low stock for items that barely meet demand
    const tightStockItems = stockMatch.matches.filter(
      (m) =>
        m.stockSufficient &&
        m.product.currentStock <= m.extractedItem.quantity * 1.2,
    );
    if (tightStockItems.length > 0) {
      actions.push({
        type: 'ALERT_LOW_STOCK',
        description: `${tightStockItems.length} item(ns) com estoque apertado — considere reabastecer`,
      });
    }

    // Suggest missing items need to be sourced
    if (stockMatch.missing.length > 0) {
      actions.push({
        type: 'CREATE_PURCHASE_ORDER',
        description: `${stockMatch.missing.length} item(ns) não encontrado(s) no estoque — necessário cadastrar e adquirir`,
        args: {
          missingItems: stockMatch.missing.map((m) => ({
            description: m.description,
            quantity: m.quantity,
            unit: m.unit,
          })),
        },
      });
    }

    // Suggest generating a proposal if match percentage is > 50%
    if (stockMatch.matchPercentage > 50) {
      actions.push({
        type: 'GENERATE_PROPOSAL',
        description: `${stockMatch.matchPercentage}% dos itens encontrados no estoque — viável gerar proposta`,
      });
    }

    // Suggest scheduling a reminder if there's an opening date
    if (extracted.documentInfo.openingDate) {
      actions.push({
        type: 'SCHEDULE_REMINDER',
        description: `Agendar lembrete para data de abertura: ${extracted.documentInfo.openingDate}`,
        args: {
          date: extracted.documentInfo.openingDate,
          title: `Abertura: ${extracted.documentInfo.title}`,
        },
      });
    }

    return actions;
  }

  /**
   * Build a human-readable summary in Portuguese.
   */
  private generateSummary(
    extracted: {
      documentInfo: DocumentAnalysisResult['documentInfo'];
      items: ExtractedItem[];
    },
    stockMatch: DocumentAnalysisResult['stockMatch'],
  ): string {
    const lines: string[] = [];

    lines.push(
      `Análise do documento "${extracted.documentInfo.title}" (${extracted.documentInfo.type}).`,
    );
    lines.push(`Órgão: ${extracted.documentInfo.organization}.`);

    if (extracted.documentInfo.estimatedValue) {
      lines.push(
        `Valor estimado: R$ ${extracted.documentInfo.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      );
    }

    lines.push(`Total de itens identificados: ${extracted.items.length}.`);
    lines.push(
      `Itens encontrados no estoque: ${stockMatch.matchedItems} de ${stockMatch.totalItems} (${stockMatch.matchPercentage}%).`,
    );

    const deficitCount = stockMatch.matches.filter(
      (m) => !m.stockSufficient,
    ).length;
    if (deficitCount > 0) {
      lines.push(
        `${deficitCount} item(ns) com estoque insuficiente para atender a demanda.`,
      );
    }

    if (stockMatch.missing.length > 0) {
      lines.push(
        `${stockMatch.missing.length} item(ns) não foram encontrados no cadastro de produtos.`,
      );
    }

    if (stockMatch.matchPercentage >= 80) {
      lines.push(
        'Recomendação: alta compatibilidade com o estoque atual. Considere participar desta licitação.',
      );
    } else if (stockMatch.matchPercentage >= 50) {
      lines.push(
        'Recomendação: compatibilidade moderada. Avalie a viabilidade de aquisição dos itens faltantes.',
      );
    } else {
      lines.push(
        'Recomendação: baixa compatibilidade com o estoque atual. Participação pode exigir investimento significativo.',
      );
    }

    return lines.join(' ');
  }
}
