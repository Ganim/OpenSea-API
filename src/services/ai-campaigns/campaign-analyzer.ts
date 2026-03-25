import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';
import type {
  ToolHandler,
  ToolExecutionContext,
} from '@/services/ai-tools/tool-types';
import { getStockHandlers } from '@/services/ai-tools/modules/stock-handlers';
import { getSalesHandlers } from '@/services/ai-tools/modules/sales-handlers';

// ─── Types ───────────────────────────────────────────────────────────

export interface CampaignSuggestion {
  title: string;
  type: 'LIQUIDATION' | 'SEASONAL' | 'CROSS_SELL' | 'LAUNCH' | 'OVERSTOCK';
  description: string;
  targetProducts: Array<{ id: string; name: string; currentStock: number }>;
  suggestedDiscount?: number;
  estimatedImpact: {
    revenueRecovery?: number;
    stockReduction?: string;
    marginImpact?: string;
  };
  suggestedActions: Array<{
    tool: string;
    description: string;
    args: Record<string, unknown>;
  }>;
}

export interface CampaignAnalysisResult {
  suggestions: CampaignSuggestion[];
  aiModel: string;
  analysisDate: string;
}

// ─── Campaign Analyzer ──────────────────────────────────────────────

export class CampaignAnalyzer {
  private stockHandlers: Record<string, ToolHandler>;
  private salesHandlers: Record<string, ToolHandler>;

  constructor(private aiRouter: AiRouter) {
    this.stockHandlers = getStockHandlers();
    this.salesHandlers = getSalesHandlers();
  }

  async analyze(
    context: ToolExecutionContext,
  ): Promise<CampaignAnalysisResult> {
    // 1. Collect data from stock and sales handlers
    const data = await this.collectData(context);

    // 2. Build prompt and send to tier 3 AI
    const analysisPrompt = this.buildAnalysisPrompt(data);

    const messages: AiProviderMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: analysisPrompt },
    ];

    const response = await this.aiRouter.complete(messages, 3, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    // 3. Parse AI response into structured suggestions
    const suggestions = this.parseResponse(response.content);

    return {
      suggestions,
      aiModel: response.model,
      analysisDate: new Date().toISOString(),
    };
  }

  private async collectData(
    context: ToolExecutionContext,
  ): Promise<CollectedData> {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [
      stockSummary,
      lowStockReport,
      movementReport,
      salesSummary,
      topCustomers,
      revenueReport,
    ] = await Promise.allSettled([
      this.stockHandlers.stock_summary.execute({}, context),
      this.stockHandlers.stock_low_stock_report.execute({ limit: 20 }, context),
      this.stockHandlers.stock_movement_report.execute(
        {
          startDate: threeMonthsAgo.toISOString(),
          endDate: now.toISOString(),
        },
        context,
      ),
      this.salesHandlers.sales_summary.execute({}, context),
      this.salesHandlers.sales_top_customers.execute({ limit: 10 }, context),
      this.salesHandlers.sales_revenue_report.execute(
        {
          startDate: threeMonthsAgo.toISOString(),
          endDate: now.toISOString(),
        },
        context,
      ),
    ]);

    return {
      stockSummary:
        stockSummary.status === 'fulfilled' ? stockSummary.value : null,
      lowStockReport:
        lowStockReport.status === 'fulfilled' ? lowStockReport.value : null,
      movementReport:
        movementReport.status === 'fulfilled' ? movementReport.value : null,
      salesSummary:
        salesSummary.status === 'fulfilled' ? salesSummary.value : null,
      topCustomers:
        topCustomers.status === 'fulfilled' ? topCustomers.value : null,
      revenueReport:
        revenueReport.status === 'fulfilled' ? revenueReport.value : null,
    };
  }

  private getSystemPrompt(): string {
    return `Você é um analista de marketing e vendas especialista em varejo e e-commerce.
Seu papel é analisar dados de estoque e vendas para sugerir campanhas de marketing inteligentes.

Você DEVE responder EXCLUSIVAMENTE em formato JSON válido, sem nenhum texto adicional antes ou depois.
O JSON deve ser um array de objetos com a seguinte estrutura:

[
  {
    "title": "Nome da campanha",
    "type": "LIQUIDATION | SEASONAL | CROSS_SELL | LAUNCH | OVERSTOCK",
    "description": "Descrição detalhada da campanha e justificativa",
    "targetProducts": [{"id": "id-do-produto", "name": "Nome", "currentStock": 100}],
    "suggestedDiscount": 15,
    "estimatedImpact": {
      "revenueRecovery": 5000,
      "stockReduction": "30% do excedente",
      "marginImpact": "Redução de 5% na margem"
    },
    "suggestedActions": [
      {
        "tool": "sales_create_promotion",
        "description": "Criar promoção de 15% para variante X",
        "args": {
          "variantId": "id-da-variante",
          "name": "Liquidação Verão",
          "discountType": "PERCENTAGE",
          "discountValue": 15,
          "startDate": "2026-03-25T00:00:00.000Z",
          "endDate": "2026-04-25T00:00:00.000Z"
        }
      }
    ]
  }
]

Regras:
- Sugira entre 1 e 5 campanhas, priorizando as mais impactantes
- Cada campanha deve ter ao menos uma ação sugerida usando ferramentas do sistema
- Use ferramentas reais: sales_create_promotion, sales_create_coupon, stock_update_product
- Descontos sugeridos devem ser realistas (5% a 50%)
- Se não houver dados suficientes, sugira campanhas genéricas baseadas nas melhores práticas
- Sempre justifique a campanha com base nos dados analisados
- Responda em português formal`;
  }

  private buildAnalysisPrompt(data: CollectedData): string {
    const parts: string[] = ['## Dados coletados para análise de campanhas\n'];

    if (data.stockSummary) {
      parts.push('### Resumo do Estoque');
      parts.push(JSON.stringify(data.stockSummary, null, 2));
      parts.push('');
    }

    if (data.lowStockReport) {
      parts.push('### Relatório de Estoque Baixo');
      parts.push(JSON.stringify(data.lowStockReport, null, 2));
      parts.push('');
    }

    if (data.movementReport) {
      parts.push('### Relatório de Movimentações (últimos 3 meses)');
      parts.push(JSON.stringify(data.movementReport, null, 2));
      parts.push('');
    }

    if (data.salesSummary) {
      parts.push('### Resumo de Vendas');
      parts.push(JSON.stringify(data.salesSummary, null, 2));
      parts.push('');
    }

    if (data.topCustomers) {
      parts.push('### Principais Clientes');
      parts.push(JSON.stringify(data.topCustomers, null, 2));
      parts.push('');
    }

    if (data.revenueReport) {
      parts.push('### Relatório de Receita (últimos 3 meses)');
      parts.push(JSON.stringify(data.revenueReport, null, 2));
      parts.push('');
    }

    parts.push(
      '\n## Instruções',
      'Com base nos dados acima, identifique:',
      '1. Produtos com movimentação lenta (>90 dias sem saída)',
      '2. Itens com excesso de estoque (quantidade >> média de vendas mensal)',
      '3. Padrões sazonais nas movimentações',
      '4. Oportunidades de venda cruzada (produtos frequentemente comprados juntos)',
      '5. Campanhas específicas com percentuais de desconto recomendados',
      '',
      'Gere sugestões de campanhas de marketing em formato JSON.',
    );

    return parts.join('\n');
  }

  private parseResponse(content: string): CampaignSuggestion[] {
    try {
      // Try to extract JSON from the response
      let jsonStr = content.trim();

      // Handle markdown code blocks
      const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        return this.wrapSingleSuggestion(parsed);
      }

      return parsed.map((item: Record<string, unknown>) =>
        this.normalizeSuggestion(item),
      );
    } catch {
      // If JSON parsing fails, create a generic suggestion from the text
      return [
        {
          title: 'Análise de campanhas',
          type: 'RECOMMENDATION' as unknown as CampaignSuggestion['type'],
          description: content.slice(0, 500),
          targetProducts: [],
          estimatedImpact: {
            marginImpact: 'Não foi possível calcular impacto automaticamente',
          },
          suggestedActions: [],
        },
      ];
    }
  }

  private normalizeSuggestion(
    item: Record<string, unknown>,
  ): CampaignSuggestion {
    const validTypes = [
      'LIQUIDATION',
      'SEASONAL',
      'CROSS_SELL',
      'LAUNCH',
      'OVERSTOCK',
    ];
    const type = validTypes.includes(item.type as string)
      ? (item.type as CampaignSuggestion['type'])
      : 'OVERSTOCK';

    return {
      title: (item.title as string) || 'Campanha sugerida',
      type,
      description: (item.description as string) || '',
      targetProducts: Array.isArray(item.targetProducts)
        ? (item.targetProducts as CampaignSuggestion['targetProducts'])
        : [],
      suggestedDiscount:
        typeof item.suggestedDiscount === 'number'
          ? item.suggestedDiscount
          : undefined,
      estimatedImpact:
        (item.estimatedImpact as CampaignSuggestion['estimatedImpact']) || {},
      suggestedActions: Array.isArray(item.suggestedActions)
        ? (item.suggestedActions as CampaignSuggestion['suggestedActions'])
        : [],
    };
  }

  private wrapSingleSuggestion(
    item: Record<string, unknown>,
  ): CampaignSuggestion[] {
    return [this.normalizeSuggestion(item)];
  }
}

// ─── Internal Types ─────────────────────────────────────────────────

interface CollectedData {
  stockSummary: unknown;
  lowStockReport: unknown;
  movementReport: unknown;
  salesSummary: unknown;
  topCustomers: unknown;
  revenueReport: unknown;
}
