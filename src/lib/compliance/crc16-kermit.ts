/**
 * CRC-16/KERMIT (CCITT-TRUE / X.25 reflected) — Portaria MTP 671/2021 Anexo I §8.
 *
 * Specification:
 * - Polynomial: 0x1021 (x^16 + x^12 + x^5 + 1), reversed representation: 0x8408
 * - Initial value: 0x0000
 * - Reflected input/output (KERMIT)
 * - No final XOR
 * - Output: 16-bit unsigned integer (0..0xFFFF)
 *
 * Golden test (Anexo I §8 — exemplo oficial):
 *   crc16Kermit(Buffer.from('123456789', 'latin1')) === 0x2189
 *
 * Implementação manual (~20 linhas) — npm `crc` deliberadamente NÃO usado
 * porque o golden oficial Portaria nos dá controle total sobre a correção
 * byte-a-byte (bug silencioso em lib externa = AFD rejeitado pelo validador
 * MTP, sem detecção em CI).
 *
 * @param data Buffer de bytes (geralmente já em ISO-8859-1) sobre o qual computar o CRC.
 * @returns CRC-16 como inteiro 16 bits (0..0xFFFF). Use `.toString(16).toUpperCase().padStart(4, '0')`
 *          para a representação canônica de 4 chars hex usada no AFD.
 */
export function crc16Kermit(data: Buffer): number {
  let crc = 0x0000;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x0001 ? (crc >> 1) ^ 0x8408 : crc >> 1;
    }
  }
  return crc & 0xffff;
}

/**
 * Helper de conveniência: computa o CRC-16/KERMIT e retorna a representação
 * canônica de 4 chars hex MAIÚSCULOS (ex: "2189") usada nos registros AFD.
 *
 * @param data Buffer sobre o qual computar o CRC.
 * @returns String hex 4 chars uppercase (ex: "2189", "0000", "FFFF").
 */
export function crc16KermitHex(data: Buffer): string {
  return crc16Kermit(data).toString(16).toUpperCase().padStart(4, '0');
}
