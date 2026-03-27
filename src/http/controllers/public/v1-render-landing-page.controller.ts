import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeRenderPublicLandingPageUseCase } from '@/use-cases/sales/landing-pages/factories/make-render-public-landing-page-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

interface HeroSection {
  heading?: string;
  subheading?: string;
  backgroundUrl?: string;
}

interface CtaSection {
  text?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

interface FeatureItem {
  title?: string;
  description?: string;
  icon?: string;
}

interface FeaturesSection {
  items?: FeatureItem[];
}

interface FormFieldForHtml {
  label: string;
  type: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
  order: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderFormFieldHtml(field: FormFieldForHtml): string {
  const required = field.isRequired ? ' required' : '';
  const requiredStar = field.isRequired
    ? '<span style="color:#ef4444">*</span>'
    : '';
  const label = escapeHtml(field.label);

  switch (field.type) {
    case 'TEXTAREA':
      return `
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151">${label} ${requiredStar}</label>
          <textarea name="${label}" rows="4" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px"${required}></textarea>
        </div>`;
    case 'SELECT': {
      const selectOptions = (field.options as { choices?: string[] })?.choices;
      const optionsHtml = selectOptions
        ? selectOptions
            .map(
              (opt: string) =>
                `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`,
            )
            .join('')
        : '';
      return `
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151">${label} ${requiredStar}</label>
          <select name="${label}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px"${required}>
            <option value="">Select...</option>
            ${optionsHtml}
          </select>
        </div>`;
    }
    case 'CHECKBOX':
      return `
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <input type="checkbox" name="${label}"${required} style="width:18px;height:18px" />
          <label style="font-weight:600;color:#374151">${label} ${requiredStar}</label>
        </div>`;
    default: {
      const inputType =
        field.type === 'EMAIL'
          ? 'email'
          : field.type === 'NUMBER'
            ? 'number'
            : field.type === 'PHONE'
              ? 'tel'
              : field.type === 'DATE'
                ? 'date'
                : 'text';
      return `
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151">${label} ${requiredStar}</label>
          <input type="${inputType}" name="${label}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px"${required} />
        </div>`;
    }
  }
}

function buildHtml(
  title: string,
  description: string | undefined,
  template: string,
  content: Record<string, unknown>,
  formFields?: FormFieldForHtml[],
): string {
  const hero = (content.hero as HeroSection) || {};
  const cta = (content.cta as CtaSection) || {};
  const features = (content.features as FeaturesSection) || {};

  const heroHeading = hero.heading
    ? escapeHtml(hero.heading)
    : escapeHtml(title);
  const heroSubheading = hero.subheading
    ? `<p style="font-size:20px;color:#6b7280;margin-top:8px">${escapeHtml(hero.subheading)}</p>`
    : description
      ? `<p style="font-size:20px;color:#6b7280;margin-top:8px">${escapeHtml(description)}</p>`
      : '';

  const heroBackground = hero.backgroundUrl
    ? `background-image:url('${escapeHtml(hero.backgroundUrl)}');background-size:cover;background-position:center;`
    : 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);';

  let featuresHtml = '';
  if (features.items && features.items.length > 0) {
    const featureCards = features.items
      .map(
        (feat) => `
      <div style="flex:1;min-width:250px;padding:24px;background:#f9fafb;border-radius:12px;text-align:center">
        ${feat.icon ? `<div style="font-size:32px;margin-bottom:12px">${escapeHtml(feat.icon)}</div>` : ''}
        <h3 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px">${feat.title ? escapeHtml(feat.title) : ''}</h3>
        <p style="font-size:14px;color:#6b7280">${feat.description ? escapeHtml(feat.description) : ''}</p>
      </div>`,
      )
      .join('');
    featuresHtml = `
      <section style="padding:48px 24px;max-width:960px;margin:0 auto">
        <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">
          ${featureCards}
        </div>
      </section>`;
  }

  let formHtml = '';
  if (formFields && formFields.length > 0) {
    const fieldsHtml = formFields.map(renderFormFieldHtml).join('');
    formHtml = `
      <section style="padding:48px 24px;max-width:520px;margin:0 auto">
        <form style="background:#fff;padding:32px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          ${fieldsHtml}
          <button type="submit" style="width:100%;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">
            Submit
          </button>
        </form>
      </section>`;
  }

  let ctaHtml = '';
  if (cta.text || cta.buttonLabel) {
    ctaHtml = `
      <section style="padding:48px 24px;text-align:center;background:#f3f4f6">
        ${cta.text ? `<p style="font-size:20px;font-weight:600;color:#111827;margin-bottom:16px">${escapeHtml(cta.text)}</p>` : ''}
        ${
          cta.buttonLabel
            ? `<a href="${cta.buttonUrl ? escapeHtml(cta.buttonUrl) : '#'}" style="display:inline-block;padding:14px 32px;background:#6366f1;color:#fff;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none">${escapeHtml(cta.buttonLabel)}</a>`
            : ''
        }
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; }
    a { color: inherit; }
  </style>
</head>
<body>
  <header style="${heroBackground}padding:80px 24px;text-align:center;color:#fff">
    <h1 style="font-size:42px;font-weight:800">${heroHeading}</h1>
    ${heroSubheading}
  </header>
  ${featuresHtml}
  ${formHtml}
  ${ctaHtml}
  <footer style="padding:24px;text-align:center;color:#9ca3af;font-size:12px">
    Powered by OpenSea
  </footer>
</body>
</html>`;
}

export async function renderLandingPageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/lp/:tenantSlug/:pageSlug',
    schema: {
      tags: ['Public - Landing Pages'],
      summary: 'Render a published landing page (public, no auth)',
      params: z.object({
        tenantSlug: z.string().min(1).max(128),
        pageSlug: z.string().min(1).max(100),
      }),
    },

    handler: async (request, reply) => {
      const { tenantSlug, pageSlug } = request.params;

      try {
        const useCase = makeRenderPublicLandingPageUseCase();
        const result = await useCase.execute({ tenantSlug, pageSlug });

        const html = buildHtml(
          result.title,
          result.description,
          result.template,
          result.content,
          result.formFields,
        );

        return reply
          .status(200)
          .header('Content-Type', 'text/html; charset=utf-8')
          .header(
            'Cache-Control',
            'public, max-age=60, stale-while-revalidate=300',
          )
          .send(html);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply
            .status(404)
            .header('Content-Type', 'text/html; charset=utf-8')
            .send('<html><body><h1>404 - Page Not Found</h1></body></html>');
        }
        throw error;
      }
    },
  });
}
