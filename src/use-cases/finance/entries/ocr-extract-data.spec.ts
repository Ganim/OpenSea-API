import { describe, it, expect } from 'vitest';
import { OcrExtractDataUseCase } from './ocr-extract-data';

describe('OcrExtractDataUseCase', () => {
  let sut: OcrExtractDataUseCase;

  beforeEach(() => {
    sut = new OcrExtractDataUseCase();
  });

  describe('text parsing', () => {
    it('should extract valor from R$ pattern', async () => {
      const result = await sut.execute({
        text: 'Valor: R$ 1.250,00\nVencimento: 15/04/2026\nBeneficiario: Empresa ABC Ltda',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.valor).toBe(1250.0);
      expect(result.extractedData.vencimento).toBe('2026-04-15');
      expect(result.extractedData.beneficiario).toBe('Empresa ABC Ltda');
      expect(result.confidence).toBe(1.0);
    });

    it('should extract valor from alternative formats', async () => {
      const result = await sut.execute({
        text: 'Total a pagar R$500,50',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.valor).toBe(500.5);
    });

    it('should extract vencimento from dd/mm/yyyy format', async () => {
      const result = await sut.execute({
        text: 'Data de vencimento: 01/12/2026',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.vencimento).toBe('2026-12-01');
    });

    it('should extract linha digitavel (47 digits)', async () => {
      const result = await sut.execute({
        text: 'Linha digitavel: 23793.38128 60000.000003 00000.000400 1 84340000012000',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.linhaDigitavel).toBeDefined();
      expect(result.extractedData.linhaDigitavel!.replace(/\D/g, '')).toHaveLength(47);
    });

    it('should extract beneficiario from "Beneficiario:" label', async () => {
      const result = await sut.execute({
        text: 'Beneficiario: Comercial Silva e Filhos\nCNPJ: 12.345.678/0001-90',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.beneficiario).toBe('Comercial Silva e Filhos');
    });

    it('should extract beneficiario from "Cedente:" label', async () => {
      const result = await sut.execute({
        text: 'Cedente: Distribuidora Norte Ltda',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.beneficiario).toBe('Distribuidora Norte Ltda');
    });

    it('should return empty data for unrecognizable text', async () => {
      const result = await sut.execute({
        text: 'Random text without financial data',
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.valor).toBeUndefined();
      expect(result.extractedData.vencimento).toBeUndefined();
      expect(result.extractedData.beneficiario).toBeUndefined();
      expect(result.confidence).toBe(1.0);
    });

    it('should handle empty text', async () => {
      const result = await sut.execute({
        text: '',
        tenantId: 'tenant-1',
      });

      expect(result.rawText).toBe('');
      expect(result.extractedData.valor).toBeUndefined();
    });

    it('should extract multiple data points from complex text', async () => {
      const result = await sut.execute({
        text: `
          BOLETO BANCARIO
          Beneficiario: Loja Virtual XPTO
          CNPJ: 00.000.000/0001-00
          Valor do documento: R$ 3.456,78
          Data de vencimento: 20/06/2026
          Nosso numero: 123456789
        `,
        tenantId: 'tenant-1',
      });

      expect(result.extractedData.valor).toBe(3456.78);
      expect(result.extractedData.vencimento).toBe('2026-06-20');
      expect(result.extractedData.beneficiario).toBe('Loja Virtual XPTO');
    });
  });
});
