import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationMessagesRepository } from '@/repositories/sales/conversation-messages-repository';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface AnalyzeSentimentUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

interface MessageSentimentResult {
  messageId: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number;
}

interface AnalyzeSentimentUseCaseResponse {
  conversationId: string;
  overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  messageSentiments: MessageSentimentResult[];
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

const POSITIVE_KEYWORDS = [
  'obrigado',
  'obrigada',
  'perfeito',
  'excelente',
  'ótimo',
  'otimo',
  'adorei',
  'sim',
  'concordo',
  'maravilhoso',
  'parabéns',
  'parabens',
  'legal',
  'bom',
  'boa',
  'gostei',
  'aprovado',
  'satisfeito',
  'satisfeita',
  'feliz',
  'fantástico',
  'fantastico',
  'incrível',
  'incrivel',
  'top',
  'show',
  'bacana',
  'agradeço',
  'agradeco',
  'thank',
  'thanks',
  'great',
  'perfect',
  'excellent',
  'good',
  'awesome',
  'wonderful',
];

const NEGATIVE_KEYWORDS = [
  'problema',
  'ruim',
  'péssimo',
  'pessimo',
  'cancelar',
  'reclamar',
  'reclamação',
  'reclamacao',
  'insatisfeito',
  'insatisfeita',
  'horrível',
  'horrivel',
  'terrível',
  'terrivel',
  'erro',
  'defeito',
  'quebrado',
  'atrasado',
  'demora',
  'absurdo',
  'vergonha',
  'lixo',
  'pior',
  'nunca',
  'jamais',
  'decepcionado',
  'decepcionada',
  'frustrado',
  'frustrada',
  'bad',
  'terrible',
  'awful',
  'worst',
  'horrible',
  'disappointed',
  'angry',
  'unacceptable',
];

function analyzeMessageSentiment(content: string): {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number;
} {
  const normalizedContent = content.toLowerCase();
  const words = normalizedContent.split(/\s+/);

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-záàâãéèêíïóôõöúç]/gi, '');
    if (POSITIVE_KEYWORDS.includes(cleanWord)) positiveScore++;
    if (NEGATIVE_KEYWORDS.includes(cleanWord)) negativeScore++;
  }

  const totalKeywords = positiveScore + negativeScore;
  if (totalKeywords === 0) {
    return { sentiment: 'NEUTRAL', score: 0 };
  }

  const score = (positiveScore - negativeScore) / totalKeywords;

  if (score > 0.2) return { sentiment: 'POSITIVE', score };
  if (score < -0.2) return { sentiment: 'NEGATIVE', score };
  return { sentiment: 'NEUTRAL', score };
}

export class AnalyzeSentimentUseCase {
  constructor(
    private conversationsRepository: ConversationsRepository,
    private conversationMessagesRepository: ConversationMessagesRepository,
  ) {}

  async execute(
    input: AnalyzeSentimentUseCaseRequest,
  ): Promise<AnalyzeSentimentUseCaseResponse> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    const messages =
      await this.conversationMessagesRepository.findByConversationId(
        new UniqueEntityID(input.conversationId),
      );

    const messageSentiments: MessageSentimentResult[] = [];
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    for (const message of messages) {
      const { sentiment, score } = analyzeMessageSentiment(message.content);

      messageSentiments.push({
        messageId: message.id.toString(),
        sentiment,
        score,
      });

      message.sentiment = sentiment;

      if (sentiment === 'POSITIVE') positiveCount++;
      else if (sentiment === 'NEGATIVE') negativeCount++;
      else neutralCount++;
    }

    // Save updated message sentiments
    for (const message of messages) {
      await this.conversationMessagesRepository.save(message);
    }

    // Determine overall sentiment
    let overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      overallSentiment = 'POSITIVE';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      overallSentiment = 'NEGATIVE';
    }

    // Update conversation overall sentiment
    conversation.overallSentiment = overallSentiment;
    await this.conversationsRepository.save(conversation);

    return {
      conversationId: input.conversationId,
      overallSentiment,
      messageSentiments,
      positiveCount,
      neutralCount,
      negativeCount,
    };
  }
}
