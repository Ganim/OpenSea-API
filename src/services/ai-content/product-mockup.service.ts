// ─── Types ──────────────────────────────────────────────────────────

export interface MockupRequest {
  productId: string;
  tenantId: string;
  templateType: 'social_media' | 'catalog' | 'banner' | 'thumbnail';
  brandLogoUrl?: string;
  customText?: string;
}

export interface MockupResult {
  imageUrl: string;
  width: number;
  height: number;
  format: string;
}

// ─── Template Dimensions ────────────────────────────────────────────

const TEMPLATE_DIMENSIONS: Record<
  MockupRequest['templateType'],
  { width: number; height: number }
> = {
  social_media: { width: 1080, height: 1080 },
  catalog: { width: 800, height: 1200 },
  banner: { width: 1200, height: 628 },
  thumbnail: { width: 300, height: 300 },
};

// ─── Service ────────────────────────────────────────────────────────

export class ProductMockupService {
  /**
   * Generate a product mockup image.
   *
   * NOTE: This is a stub for future integration with image generation APIs
   * (DALL-E, Midjourney, Stable Diffusion, etc.). The actual implementation
   * will be added when image AI providers are configured.
   */
  async generate(request: MockupRequest): Promise<MockupResult> {
    const dimensions =
      TEMPLATE_DIMENSIONS[request.templateType] ??
      TEMPLATE_DIMENSIONS.social_media;

    // Validate required fields before throwing the "not available" error
    if (!request.productId) {
      throw new Error('O ID do produto e obrigatorio para geracao de mockup.');
    }

    if (!request.tenantId) {
      throw new Error('O ID do tenant e obrigatorio para geracao de mockup.');
    }

    // TODO: Integrate with image generation API (DALL-E, Midjourney, Stable Diffusion)
    // Implementation plan:
    // 1. Fetch product data (name, description, images) from stock repository
    // 2. Build prompt with product info + template type + brand guidelines
    // 3. Call image generation provider
    // 4. Upload result to S3 storage
    // 5. Return URL and metadata

    throw new Error(
      `Geracao de mockups sera disponibilizada em breve. ` +
        `Template solicitado: ${request.templateType} (${dimensions.width}x${dimensions.height}). ` +
        `Utilize as ferramentas de catalogo para criar materiais visuais.`,
    );
  }

  /**
   * Check if the mockup generation service is available.
   */
  isAvailable(): boolean {
    // Will return true once an image AI provider is configured
    return false;
  }

  /**
   * Returns supported template types with their dimensions.
   */
  getSupportedTemplates(): Array<{
    type: MockupRequest['templateType'];
    width: number;
    height: number;
    description: string;
  }> {
    return [
      {
        type: 'social_media',
        width: 1080,
        height: 1080,
        description: 'Post quadrado para Instagram/Facebook (1080x1080)',
      },
      {
        type: 'catalog',
        width: 800,
        height: 1200,
        description: 'Pagina de catalogo vertical (800x1200)',
      },
      {
        type: 'banner',
        width: 1200,
        height: 628,
        description: 'Banner horizontal para web/marketplace (1200x628)',
      },
      {
        type: 'thumbnail',
        width: 300,
        height: 300,
        description: 'Miniatura para listagens (300x300)',
      },
    ];
  }
}
