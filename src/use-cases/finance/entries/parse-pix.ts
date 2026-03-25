import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  PixCode,
  type PixParseResult,
} from '@/entities/finance/value-objects/pix-code';

interface ParsePixUseCaseRequest {
  code: string;
}

interface ParsePixUseCaseResponse {
  pix: PixParseResult;
}

export class ParsePixUseCase {
  async execute({
    code,
  }: ParsePixUseCaseRequest): Promise<ParsePixUseCaseResponse> {
    if (!code || code.trim().length === 0) {
      throw new BadRequestError('Código Pix é obrigatório.');
    }

    const result = PixCode.parse(code);

    if (!result) {
      throw new BadRequestError('Código Pix inválido.');
    }

    return { pix: result };
  }
}
