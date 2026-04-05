import { describe, expect, it } from 'vitest';
import { ReceiptBuilder } from './receipt-template';

describe('ReceiptBuilder', () => {
  it('should generate a valid ESC/POS receipt', () => {
    const generator = new ReceiptBuilder({
      paperWidth: 80,
      companyName: 'OpenSea',
      cnpj: '00.000.000/0000-00',
    })
      .addHeader({ name: 'OpenSea', cnpj: '00.000.000/0000-00' })
      .addItems([
        { name: 'Produto A', quantity: 2, unitPrice: 10, subtotal: 20 },
        { name: 'Produto B', quantity: 1, unitPrice: 30, subtotal: 30 },
      ])
      .addTotals(50, 0, 50, 5)
      .addPaymentMethod('PIX', 50)
      .addQrCode('order-123')
      .addFooter('Volte sempre!')
      .generate();

    const bytes = generator.toBytes();
    const base64 = generator.toBase64();

    expect(bytes.length).toBeGreaterThan(0);
    expect(base64.length).toBeGreaterThan(0);
  });
});
