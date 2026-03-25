/**
 * OFX/OFC file parser for Brazilian bank statements.
 *
 * OFX (Open Financial Exchange) is an XML-based format used by banks
 * to export financial statements. This parser handles the SGML-like
 * format used by Brazilian banks (BB, Itau, Bradesco, Santander, Caixa, Nubank).
 */

export interface ParsedOfxTransaction {
  fitId: string;
  transactionDate: Date;
  amount: number;
  description: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface ParsedOfxAccountInfo {
  bankId: string;
  accountId: string;
  accountType: string;
}

export interface ParsedOfxResult {
  accountInfo: ParsedOfxAccountInfo;
  transactions: ParsedOfxTransaction[];
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Converts an OFX date string (YYYYMMDDHHMMSS or YYYYMMDD) to a Date object.
 * Brazilian banks may omit the time portion or include timezone offset.
 */
function parseOfxDate(dateStr: string): Date {
  const cleaned = dateStr.trim().split('[')[0]; // Remove timezone bracket [GMT-3:BRT]

  if (cleaned.length < 8) {
    throw new Error(`Invalid OFX date format: ${dateStr}`);
  }

  const year = parseInt(cleaned.substring(0, 4), 10);
  const month = parseInt(cleaned.substring(4, 6), 10) - 1;
  const day = parseInt(cleaned.substring(6, 8), 10);
  const hour =
    cleaned.length >= 10 ? parseInt(cleaned.substring(8, 10), 10) : 0;
  const minute =
    cleaned.length >= 12 ? parseInt(cleaned.substring(10, 12), 10) : 0;
  const second =
    cleaned.length >= 14 ? parseInt(cleaned.substring(12, 14), 10) : 0;

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Extracts the text content between an OFX tag and the next tag or newline.
 * OFX uses SGML-like syntax where closing tags are optional.
 */
function extractTagValue(content: string, tagName: string): string | null {
  // Match <TAGNAME>value with possible whitespace and newlines
  const regex = new RegExp(`<${tagName}>\\s*([^<\\r\\n]+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extracts all occurrences of a block between start and end tags.
 */
function extractBlocks(content: string, blockTag: string): string[] {
  const blocks: string[] = [];
  const openTag = `<${blockTag}>`;
  const closeTag = `</${blockTag}>`;

  let searchFrom = 0;
  while (true) {
    const startIdx = content.indexOf(openTag, searchFrom);
    if (startIdx === -1) break;

    let endIdx = content.indexOf(closeTag, startIdx);
    if (endIdx === -1) {
      // OFX may not have closing tags - find next same-level block or end
      const nextStartIdx = content.indexOf(openTag, startIdx + openTag.length);
      endIdx = nextStartIdx !== -1 ? nextStartIdx : content.length;
    } else {
      endIdx += closeTag.length;
    }

    blocks.push(content.substring(startIdx, endIdx));
    searchFrom = endIdx;
  }

  return blocks;
}

/**
 * Determines the transaction type based on the TRNTYPE and amount.
 * Brazilian banks may use various TRNTYPE values.
 */
function resolveTransactionType(
  trnType: string | null,
  amount: number,
): 'DEBIT' | 'CREDIT' {
  if (amount < 0) return 'DEBIT';
  if (amount > 0) return 'CREDIT';

  // Fallback to OFX TRNTYPE if amount is exactly 0
  const debitTypes = ['DEBIT', 'CHECK', 'PAYMENT', 'FEE', 'SRVCHG', 'ATM'];
  if (trnType && debitTypes.includes(trnType.toUpperCase())) return 'DEBIT';

  return 'CREDIT';
}

/**
 * Attempts to decode the file buffer, handling ISO-8859-1 and UTF-8 encodings.
 * Brazilian bank OFX files are often encoded in ISO-8859-1 (Latin-1).
 */
function decodeOfxBuffer(buffer: Buffer): string {
  const rawUtf8 = buffer.toString('utf-8');

  // Check for encoding declaration in the OFX header
  const charsetMatch = rawUtf8.match(/CHARSET:\s*(\S+)/i);
  const encodingMatch = rawUtf8.match(/encoding\s*=\s*["']?([^"'\s>]+)/i);
  const declaredEncoding = charsetMatch?.[1] || encodingMatch?.[1] || '';

  if (
    declaredEncoding.toUpperCase().includes('1252') ||
    declaredEncoding.toUpperCase().includes('8859')
  ) {
    // Decode as Latin-1
    return buffer.toString('latin1');
  }

  // If the UTF-8 string contains replacement characters, try Latin-1
  if (rawUtf8.includes('\ufffd')) {
    return buffer.toString('latin1');
  }

  return rawUtf8;
}

/**
 * Parses an OFX/OFC file buffer and extracts transactions and account info.
 *
 * @param fileBuffer - The raw file buffer
 * @returns Parsed OFX result with account info, transactions, and period
 * @throws Error if the file is not a valid OFX file or contains no transactions
 */
export function parseOfxFile(fileBuffer: Buffer): ParsedOfxResult {
  const content = decodeOfxBuffer(fileBuffer);

  // Validate OFX content
  if (
    !content.includes('<OFX>') &&
    !content.includes('<ofx>') &&
    !content.includes('OFXHEADER') &&
    !content.includes('<OFC>')
  ) {
    throw new Error('Invalid OFX file: missing OFX header or root element');
  }

  // Extract account info
  const bankId = extractTagValue(content, 'BANKID') ?? '';
  const accountId = extractTagValue(content, 'ACCTID') ?? '';
  const rawAccountType = extractTagValue(content, 'ACCTTYPE') ?? 'CHECKING';

  const accountInfo: ParsedOfxAccountInfo = {
    bankId,
    accountId,
    accountType: rawAccountType.toUpperCase(),
  };

  // Extract statement period
  const periodStartStr = extractTagValue(content, 'DTSTART');
  const periodEndStr = extractTagValue(content, 'DTEND');

  // Extract transactions
  const transactionBlocks = extractBlocks(content, 'STMTTRN');

  if (transactionBlocks.length === 0) {
    throw new Error('No transactions found in OFX file');
  }

  const transactions: ParsedOfxTransaction[] = [];
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;

  for (const block of transactionBlocks) {
    const fitId = extractTagValue(block, 'FITID');
    const dateStr = extractTagValue(block, 'DTPOSTED');
    const amountStr = extractTagValue(block, 'TRNAMT');
    const memo = extractTagValue(block, 'MEMO');
    const name = extractTagValue(block, 'NAME');
    const trnType = extractTagValue(block, 'TRNTYPE');

    if (!fitId || !dateStr || !amountStr) {
      continue; // Skip incomplete transactions
    }

    const transactionDate = parseOfxDate(dateStr);
    const amount = parseFloat(amountStr.replace(',', '.'));

    if (isNaN(amount)) continue;

    const description = memo || name || 'Transação sem descrição';
    const type = resolveTransactionType(trnType, amount);

    transactions.push({
      fitId,
      transactionDate,
      amount: Math.abs(amount),
      description,
      type,
    });

    // Track period bounds
    if (!earliestDate || transactionDate < earliestDate) {
      earliestDate = transactionDate;
    }
    if (!latestDate || transactionDate > latestDate) {
      latestDate = transactionDate;
    }
  }

  // Determine period from header or from transaction dates
  const periodStart = periodStartStr
    ? parseOfxDate(periodStartStr)
    : (earliestDate ?? new Date());
  const periodEnd = periodEndStr
    ? parseOfxDate(periodEndStr)
    : (latestDate ?? new Date());

  return {
    accountInfo,
    transactions,
    periodStart,
    periodEnd,
  };
}
