export class Slug {
  public value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(slug: string): Slug {
    return new Slug(slug);
  }

  /**
   * Receives a string and normalize it as a slug
   *
   * Example: "An example title" => "an-example-title"
   *
   * @param text {string}
   */
  static createFromText(text: string): Slug {
    const slugText = text
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Substitui um ou mais espaços por hífen
      .replace(/[^\w-]+/g, '') // Remove tudo que não são palavras ou hífens
      .replace(/_/g, '-') // Substitui underlines por hífens
      .replace(/--+/g, '-') // Substitui múltiplos hífens por um único
      .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim

    return new Slug(slugText);
  }

  /**
   * Generates a unique slug by appending a suffix
   *
   * @param baseText The base text to create slug from
   * @param suffix A unique suffix (e.g., sequential number or random string)
   */
  static createUniqueFromText(baseText: string, suffix: string): Slug {
    const baseSlug = Slug.createFromText(baseText);
    return new Slug(`${baseSlug.value}-${suffix}`);
  }

  /**
   * Validates if a string is a valid slug
   */
  static isValid(slug: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  toString(): string {
    return this.value;
  }

  equals(slug: Slug): boolean {
    return this.value === slug.value;
  }
}
