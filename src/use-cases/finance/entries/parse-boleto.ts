import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { BoletoBarcode, type BoletoParseResult } from '@/entities/finance';

interface ParseBoletoUseCaseRequest {
  barcode: string;
}

interface ParseBoletoUseCaseResponse {
  boleto: BoletoParseResult;
}

export class ParseBoletoUseCase {
  async execute({
    barcode,
  }: ParseBoletoUseCaseRequest): Promise<ParseBoletoUseCaseResponse> {
    if (!barcode || barcode.trim().length === 0) {
      throw new BadRequestError('Barcode is required');
    }

    const parsed = BoletoBarcode.parse(barcode);

    if (!parsed) {
      throw new BadRequestError('Invalid barcode or digit line');
    }

    return { boleto: parsed.toResult() };
  }
}
