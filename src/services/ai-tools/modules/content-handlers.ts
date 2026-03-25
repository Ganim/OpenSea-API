import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { makeGenerateContentUseCase } from '@/use-cases/ai/content/factories/make-generate-content-use-case';
import type { ContentType } from '@/services/ai-content/content-generator';

// ─── Helper ──────────────────────────────────────────────────────────

async function generateContent(
  type: ContentType,
  args: Record<string, unknown>,
  context: ToolExecutionContext,
) {
  const useCase = makeGenerateContentUseCase();
  const result = await useCase.execute({
    tenantId: context.tenantId,
    userId: context.userId,
    userPermissions: context.permissions,
    type,
    context: {
      productIds: args.productIds as string[] | undefined,
      promotionId: args.promotionId as string | undefined,
      theme: args.theme as string | undefined,
      tone: args.tone as string | undefined,
      platform: args.platform as string | undefined,
      maxLength: args.maxLength as number | undefined,
    },
  });

  const c = result.content;
  return {
    type: c.type,
    content: c.content,
    metadata: c.metadata,
    variantCount: (c.variants?.length ?? 0) + 1,
    variants: c.variants?.map((v) => ({
      content: v.content,
      metadata: v.metadata,
    })),
  };
}

// ─── Export ──────────────────────────────────────────────────────────

export function getContentHandlers(): Record<string, ToolHandler> {
  return {
    content_generate_social_post: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        return generateContent('SOCIAL_POST', args, context);
      },
    },

    content_generate_product_desc: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // For product description, convert single productId to productIds array
        const adjustedArgs = { ...args };
        if (args.productId && !args.productIds) {
          adjustedArgs.productIds = [args.productId as string];
        }
        return generateContent('PRODUCT_DESCRIPTION', adjustedArgs, context);
      },
    },

    content_generate_email_campaign: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        return generateContent('EMAIL_CAMPAIGN', args, context);
      },
    },

    content_generate_promotion_text: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        return generateContent('PROMOTION_BANNER', args, context);
      },
    },
  };
}
