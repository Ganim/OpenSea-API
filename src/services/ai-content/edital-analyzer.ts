import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';
import { truncateContent } from '@/services/ai-documents/pdf-extractor';

// ─── Types ──────────────────────────────────────────────────────────

export interface EditalItem {
  itemNumber: number;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
}

export interface EditalAnalysisResult {
  title: string;
  modality: string;
  agency: string;
  openingDate?: string;
  estimatedValue?: number;
  items: EditalItem[];
  requirements: string[];
  documents: string[];
  summary: string;
}

// ─── Prompt ─────────────────────────────────────────────────────────

function buildEditalExtractionPrompt(pdfText: string): AiProviderMessage[] {
  return [
    {
      role: 'system',
      content: `Você é um especialista em análise de editais de licitação do governo brasileiro.

Analise o edital de licitação fornecido e extraia as informações em JSON. Retorne EXCLUSIVAMENTE JSON válido, sem texto adicional.

Estrutura exigida:
{
  "title": "título completo do edital",
  "modality": "Pregão Eletrônico|Pregão Presencial|Concorrência|Tomada de Preço|Convite|Leilão|Concurso|RDC|Dispensa|Inexigibilidade|Outro",
  "agency": "nome do órgão/entidade licitante",
  "openingDate": "YYYY-MM-DD ou null",
  "estimatedValue": 0.00,
  "items": [
    {
      "itemNumber": 1,
      "description": "descrição completa do item",
      "quantity": 10,
      "unit": "UN|KG|M|L|CX|PCT|etc",
      "estimatedUnitPrice": 0.00
    }
  ],
  "requirements": [
    "requisito de habilitação ou qualificação técnica"
  ],
  "documents": [
    "documento necessário para participação"
  ]
}

Regras:
- Extraia TODOS os itens listados no edital
- Se a quantidade não estiver clara, use 1
- Se a unidade não estiver clara, use "UN"
- Se o preço unitário estimado não existir, omita estimatedUnitPrice
- Em "requirements", inclua requisitos de habilitação jurídica, qualificação técnica, qualificação econômico-financeira e regularidade fiscal
- Em "documents", inclua todos os documentos necessários para habilitação e proposta
- Retorne SOMENTE o JSON, sem formatação markdown`,
    },
    {
      role: 'user',
      content: `Analise este edital de licitação e extraia as informações estruturadas:\n\n${pdfText}`,
    },
  ];
}

// ─── Edital Analyzer ────────────────────────────────────────────────

export class EditalAnalyzer {
  constructor(private readonly aiRouter: AiRouter) {}

  async analyze(
    pdfText: string,
    _tenantId: string,
  ): Promise<EditalAnalysisResult> {
    const truncatedText = truncateContent(pdfText);

    const messages = buildEditalExtractionPrompt(truncatedText);

    // Tier 3 (Claude/Gemini Pro) for complex document analysis
    const aiResponse = await this.aiRouter.complete(messages, 3, {
      temperature: 0.1,
      maxTokens: 6000,
    });

    return this.parseEditalResponse(aiResponse.content);
  }

  private parseEditalResponse(content: string): EditalAnalysisResult {
    let cleaned = content.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned);

      const title = String(parsed.title ?? 'Edital sem título');
      const modality = String(parsed.modality ?? 'Não identificado');
      const agency = String(parsed.agency ?? 'Não identificado');

      const openingDate =
        typeof parsed.openingDate === 'string' ? parsed.openingDate : undefined;

      const estimatedValue =
        typeof parsed.estimatedValue === 'number'
          ? parsed.estimatedValue
          : undefined;

      const items: EditalItem[] = Array.isArray(parsed.items)
        ? parsed.items.map((item: Record<string, unknown>, index: number) => ({
            itemNumber:
              typeof item.itemNumber === 'number' ? item.itemNumber : index + 1,
            description: String(item.description ?? ''),
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            unit: String(item.unit ?? 'UN'),
            ...(typeof item.estimatedUnitPrice === 'number'
              ? { estimatedUnitPrice: item.estimatedUnitPrice }
              : {}),
          }))
        : [];

      const requirements: string[] = Array.isArray(parsed.requirements)
        ? parsed.requirements.map(String)
        : [];

      const documents: string[] = Array.isArray(parsed.documents)
        ? parsed.documents.map(String)
        : [];

      // Build summary
      const summaryLines: string[] = [];
      summaryLines.push(`Edital: "${title}" — Modalidade: ${modality}.`);
      summaryLines.push(`Orgao licitante: ${agency}.`);
      if (openingDate) {
        summaryLines.push(`Data de abertura: ${openingDate}.`);
      }
      if (estimatedValue) {
        summaryLines.push(
          `Valor estimado: R$ ${estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        );
      }
      summaryLines.push(
        `${items.length} item(ns) identificado(s). ${requirements.length} requisito(s) de habilitacao. ${documents.length} documento(s) necessario(s).`,
      );

      return {
        title,
        modality,
        agency,
        openingDate,
        estimatedValue,
        items,
        requirements,
        documents,
        summary: summaryLines.join(' '),
      };
    } catch {
      throw new Error(
        'Falha ao interpretar a resposta da IA na analise do edital. O documento pode estar em formato nao suportado.',
      );
    }
  }
}
