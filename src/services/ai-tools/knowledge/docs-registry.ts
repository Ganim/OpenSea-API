export interface DocEntry {
  module: string;
  feature: string;
  type: 'overview' | 'guide' | 'troubleshooting' | 'limitation';
  keywords: string[];
  requiredPermissions: string[];
  navPath?: string;
  title: string;
  content: string;
}

export class DocsRegistry {
  private docs: DocEntry[] = [];

  register(doc: DocEntry): void {
    this.docs.push(doc);
  }

  registerMany(docs: DocEntry[]): void {
    this.docs.push(...docs);
  }

  /**
   * Find docs relevant to user message, filtered by permissions.
   * Returns top N docs sorted by relevance score.
   */
  findRelevantDocs(
    message: string,
    userPermissions: string[],
    limit = 3,
  ): DocEntry[] {
    const permSet = new Set(userPermissions);
    const lowerMessage = message.toLowerCase();

    const scored = this.docs
      .filter((doc) => doc.requiredPermissions.every((p) => permSet.has(p)))
      .map((doc) => ({ doc, score: this.scoreDoc(doc, lowerMessage) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ doc }) => doc);
  }

  getDocsByModule(module: string): DocEntry[] {
    return this.docs.filter((d) => d.module === module);
  }

  getAllDocs(): DocEntry[] {
    return [...this.docs];
  }

  private scoreDoc(doc: DocEntry, lowerMessage: string): number {
    let score = 0;

    // Title match
    if (lowerMessage.includes(doc.title.toLowerCase())) score += 15;

    // Keyword matches
    for (const kw of doc.keywords) {
      if (lowerMessage.includes(kw.toLowerCase())) score += 5;
    }

    // Feature name match
    if (lowerMessage.includes(doc.feature.toLowerCase())) score += 8;

    // Module name match
    if (lowerMessage.includes(doc.module.toLowerCase())) score += 3;

    // Boost troubleshooting if message contains problem words
    const problemWords = [
      'erro',
      'error',
      'problema',
      'não consigo',
      'nao consigo',
      'falha',
      'bug',
      'ajuda',
    ];
    const hasProblem = problemWords.some((w) => lowerMessage.includes(w));
    if (hasProblem && doc.type === 'troubleshooting') score += 10;

    // Boost guides if message contains "how to" words
    const howToWords = [
      'como',
      'passo',
      'criar',
      'cadastrar',
      'configurar',
      'fazer',
      'adicionar',
      'registrar',
    ];
    const hasHowTo = howToWords.some((w) => lowerMessage.includes(w));
    if (hasHowTo && doc.type === 'guide') score += 10;

    return score;
  }
}
