import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';

// ─── Request / Response Types ────────────────────────────────────────

export type ContentType =
  | 'SOCIAL_POST'
  | 'PRODUCT_DESCRIPTION'
  | 'EMAIL_CAMPAIGN'
  | 'CATALOG_TEXT'
  | 'PROMOTION_BANNER';

export interface ContentGenerationRequest {
  tenantId: string;
  userId: string;
  userPermissions: string[];
  type: ContentType;
  context: {
    productIds?: string[];
    categoryId?: string;
    promotionId?: string;
    theme?: string;
    tone?: string;
    platform?: string;
    maxLength?: number;
  };
}

export interface GeneratedContentBody {
  title?: string;
  body: string;
  hashtags?: string[];
  callToAction?: string;
}

export interface GeneratedContentMetadata {
  platform?: string;
  characterCount: number;
  suggestedImageDescription?: string;
  targetAudience?: string;
}

export interface GeneratedContent {
  type: string;
  content: GeneratedContentBody;
  metadata: GeneratedContentMetadata;
  variants?: GeneratedContent[];
}

// ─── Product / Promotion data shapes ─────────────────────────────────

export interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  categoryName?: string | null;
  manufacturerName?: string | null;
  variants?: Array<{
    name: string;
    sku: string;
    price?: number | null;
  }>;
}

export interface PromotionData {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  variantId: string;
  isCurrentlyValid: boolean;
}

// ─── Prompt Building ─────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Você é um especialista em marketing digital e copywriting para e-commerce.
Seu trabalho é criar conteúdo de marketing de alta qualidade em português brasileiro.
Sempre responda APENAS com o JSON solicitado, sem texto adicional.
Use linguagem persuasiva, chamativa e adequada ao público-alvo.
Inclua emojis quando o tom permitir (casual, urgente).
Para tom luxo, use linguagem sofisticada sem emojis.`;
}

function buildSocialPostPrompt(
  products: ProductData[],
  promotion: PromotionData | null,
  platform: string,
  tone: string,
  theme: string | undefined,
  maxLength: number,
): string {
  const productInfo = products
    .map((p) => {
      const variants = p.variants
        ?.map(
          (v) =>
            `  - ${v.name} (SKU: ${v.sku}${v.price ? `, R$ ${v.price.toFixed(2)}` : ''})`,
        )
        .join('\n');
      return `Produto: ${p.name}\nDescrição: ${p.description || 'Sem descrição'}\nCategoria: ${p.categoryName || 'N/A'}\nFabricante: ${p.manufacturerName || 'N/A'}\nVariantes:\n${variants || '  Nenhuma'}`;
    })
    .join('\n\n');

  const promoInfo = promotion
    ? `\nPromoção: ${promotion.name}\nDesconto: ${promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : `R$ ${promotion.discountValue.toFixed(2)}`}\nValidade: ${promotion.startDate} até ${promotion.endDate}`
    : '';

  return `Gere um post para ${platform} sobre os produtos/promoções a seguir.
Tom: ${tone}. Máximo ${maxLength} caracteres no corpo.
${theme ? `Tema/Ocasião: ${theme}` : ''}

Dados dos produtos:
${productInfo}
${promoInfo}

Responda com um JSON no formato:
{
  "variants": [
    {
      "title": "título chamativo",
      "body": "texto persuasivo do post",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "callToAction": "frase de chamada para ação",
      "suggestedImageDescription": "descrição da imagem ideal para acompanhar o post",
      "targetAudience": "público-alvo sugerido"
    },
    {
      "title": "título alternativo",
      "body": "texto alternativo do post",
      "hashtags": ["hashtag1", "hashtag2"],
      "callToAction": "CTA alternativo",
      "suggestedImageDescription": "descrição de imagem alternativa",
      "targetAudience": "público-alvo"
    },
    {
      "title": "terceira opção de título",
      "body": "terceira versão do texto",
      "hashtags": ["hashtag1", "hashtag2"],
      "callToAction": "CTA",
      "suggestedImageDescription": "descrição de imagem",
      "targetAudience": "público-alvo"
    }
  ]
}

Gere exatamente 3 variantes diferentes. Cada uma com abordagem distinta.`;
}

function buildProductDescriptionPrompt(
  product: ProductData,
  tone: string,
  maxLength: number,
): string {
  const variants = product.variants
    ?.map(
      (v) =>
        `  - ${v.name} (SKU: ${v.sku}${v.price ? `, R$ ${v.price.toFixed(2)}` : ''})`,
    )
    .join('\n');

  return `Crie uma descrição comercial persuasiva para o seguinte produto.
Tom: ${tone}. Máximo ${maxLength} caracteres.
Destaque benefícios e diferenciais.

Produto: ${product.name}
Descrição atual: ${product.description || 'Sem descrição'}
Categoria: ${product.categoryName || 'N/A'}
Fabricante: ${product.manufacturerName || 'N/A'}
Variantes:
${variants || '  Nenhuma'}

Responda com um JSON no formato:
{
  "variants": [
    {
      "title": "título/headline da descrição",
      "body": "descrição comercial completa e persuasiva",
      "callToAction": "frase de chamada para ação",
      "suggestedImageDescription": "descrição de foto ideal para o produto",
      "targetAudience": "público-alvo sugerido"
    },
    {
      "title": "título alternativo",
      "body": "descrição alternativa com abordagem diferente",
      "callToAction": "CTA alternativo",
      "suggestedImageDescription": "outra sugestão de foto",
      "targetAudience": "público-alvo"
    }
  ]
}

Gere exatamente 2 variantes com abordagens distintas.`;
}

function buildEmailCampaignPrompt(
  products: ProductData[],
  promotion: PromotionData | null,
  tone: string,
  theme: string | undefined,
  maxLength: number,
): string {
  const productInfo = products
    .map((p) => {
      const bestVariant = p.variants?.[0];
      return `- ${p.name}${bestVariant?.price ? ` (R$ ${bestVariant.price.toFixed(2)})` : ''}: ${p.description || 'Sem descrição'}`;
    })
    .join('\n');

  const promoInfo = promotion
    ? `\nPromoção ativa: ${promotion.name} — ${promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}% de desconto` : `R$ ${promotion.discountValue.toFixed(2)} de desconto`}\nVálida até: ${promotion.endDate}`
    : '';

  return `Crie um email marketing completo sobre ${theme || 'nossos produtos em destaque'}.
Tom: ${tone}. Máximo ${maxLength} caracteres no corpo.

Produtos em destaque:
${productInfo}
${promoInfo}

Responda com um JSON no formato:
{
  "variants": [
    {
      "title": "assunto do email (chamativo e direto, max 60 caracteres)",
      "body": "corpo completo do email com saudação, conteúdo principal e despedida",
      "callToAction": "texto do botão CTA principal",
      "suggestedImageDescription": "descrição do banner/header ideal para o email",
      "targetAudience": "segmento de clientes ideal"
    },
    {
      "title": "assunto alternativo",
      "body": "corpo alternativo com abordagem diferente",
      "callToAction": "CTA alternativo",
      "suggestedImageDescription": "banner alternativo",
      "targetAudience": "segmento alternativo"
    },
    {
      "title": "terceiro assunto",
      "body": "terceira versão do email",
      "callToAction": "CTA",
      "suggestedImageDescription": "banner",
      "targetAudience": "segmento"
    }
  ]
}

Gere exatamente 3 variantes diferentes.`;
}

function buildPromotionBannerPrompt(
  products: ProductData[],
  promotion: PromotionData | null,
  tone: string,
  theme: string | undefined,
  maxLength: number,
): string {
  const productNames = products.map((p) => p.name).join(', ');

  const promoInfo = promotion
    ? `Promoção: ${promotion.name}\nDesconto: ${promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : `R$ ${promotion.discountValue.toFixed(2)}`}\nValidade: ${promotion.startDate} até ${promotion.endDate}`
    : 'Nenhuma promoção específica vinculada.';

  return `Gere textos curtos e impactantes para banner ou material promocional.
Tom: ${tone}. Máximo ${maxLength} caracteres por texto.
${theme ? `Tema: ${theme}` : ''}

Produtos: ${productNames || 'Geral da loja'}
${promoInfo}

Responda com um JSON no formato:
{
  "variants": [
    {
      "title": "headline do banner (curto e impactante)",
      "body": "texto de apoio do banner",
      "callToAction": "texto do botão",
      "suggestedImageDescription": "descrição visual do banner ideal",
      "targetAudience": "público-alvo"
    },
    {
      "title": "headline alternativo",
      "body": "texto alternativo",
      "callToAction": "CTA",
      "suggestedImageDescription": "visual alternativo",
      "targetAudience": "público"
    },
    {
      "title": "terceira opção",
      "body": "terceiro texto",
      "callToAction": "CTA",
      "suggestedImageDescription": "visual",
      "targetAudience": "público"
    }
  ]
}

Gere exatamente 3 variantes diferentes.`;
}

// ─── Content Generator ───────────────────────────────────────────────

export class ContentGenerator {
  constructor(private readonly aiRouter: AiRouter) {}

  async generate(
    request: ContentGenerationRequest,
    products: ProductData[],
    promotion: PromotionData | null,
  ): Promise<GeneratedContent> {
    const {
      type,
      context: { platform, tone, theme, maxLength },
    } = request;

    const messages: AiProviderMessage[] = [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: this.buildPromptForType(
          type,
          products,
          promotion,
          platform,
          tone,
          theme,
          maxLength,
        ),
      },
    ];

    const response = await this.aiRouter.complete(messages, 3, {
      temperature: 0.8,
      maxTokens: 4000,
    });

    return this.parseResponse(response.content, type, platform);
  }

  private buildPromptForType(
    type: ContentType,
    products: ProductData[],
    promotion: PromotionData | null,
    platform?: string,
    tone?: string,
    theme?: string,
    maxLength?: number,
  ): string {
    switch (type) {
      case 'SOCIAL_POST':
        return buildSocialPostPrompt(
          products,
          promotion,
          platform || 'instagram',
          tone || 'casual',
          theme,
          maxLength || 2200,
        );

      case 'PRODUCT_DESCRIPTION':
      case 'CATALOG_TEXT': {
        const product = products[0];
        if (!product) {
          return buildProductDescriptionPrompt(
            {
              id: '',
              name: 'Produto genérico',
              status: 'ACTIVE',
            },
            tone || 'formal',
            maxLength || 1000,
          );
        }
        return buildProductDescriptionPrompt(
          product,
          tone || 'formal',
          maxLength || 1000,
        );
      }

      case 'EMAIL_CAMPAIGN':
        return buildEmailCampaignPrompt(
          products,
          promotion,
          tone || 'formal',
          theme,
          maxLength || 3000,
        );

      case 'PROMOTION_BANNER':
        return buildPromotionBannerPrompt(
          products,
          promotion,
          tone || 'urgente',
          theme,
          maxLength || 500,
        );

      default:
        return buildSocialPostPrompt(
          products,
          promotion,
          platform || 'instagram',
          tone || 'casual',
          theme,
          maxLength || 2200,
        );
    }
  }

  private parseResponse(
    rawContent: string,
    type: ContentType,
    platform?: string,
  ): GeneratedContent {
    // Try to extract JSON from the response
    let parsed: { variants: Array<Record<string, unknown>> };

    try {
      // Try direct parse first
      parsed = JSON.parse(rawContent);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch?.[1]) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim());
        } catch {
          // Fallback: return the raw content as-is
          return this.fallbackContent(rawContent, type, platform);
        }
      } else {
        // Try to find a JSON object in the text
        const objectMatch = rawContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            parsed = JSON.parse(objectMatch[0]);
          } catch {
            return this.fallbackContent(rawContent, type, platform);
          }
        } else {
          return this.fallbackContent(rawContent, type, platform);
        }
      }
    }

    if (!parsed.variants || !Array.isArray(parsed.variants)) {
      return this.fallbackContent(rawContent, type, platform);
    }

    const [primary, ...rest] = parsed.variants;

    if (!primary) {
      return this.fallbackContent(rawContent, type, platform);
    }

    const mainContent = this.variantToContent(primary, type, platform);
    mainContent.variants = rest.map((v) =>
      this.variantToContent(v, type, platform),
    );

    return mainContent;
  }

  private variantToContent(
    variant: Record<string, unknown>,
    type: ContentType,
    platform?: string,
  ): GeneratedContent {
    const body = (variant.body as string) || '';
    const title = variant.title as string | undefined;
    const hashtags = variant.hashtags as string[] | undefined;
    const callToAction = variant.callToAction as string | undefined;
    const suggestedImageDescription = variant.suggestedImageDescription as
      | string
      | undefined;
    const targetAudience = variant.targetAudience as string | undefined;

    return {
      type,
      content: {
        title,
        body,
        hashtags,
        callToAction,
      },
      metadata: {
        platform,
        characterCount: body.length + (title?.length || 0),
        suggestedImageDescription,
        targetAudience,
      },
    };
  }

  private fallbackContent(
    rawContent: string,
    type: ContentType,
    platform?: string,
  ): GeneratedContent {
    return {
      type,
      content: {
        body: rawContent,
      },
      metadata: {
        platform,
        characterCount: rawContent.length,
      },
    };
  }
}
