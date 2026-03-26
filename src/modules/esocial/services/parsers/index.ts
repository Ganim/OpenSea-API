export type { EsocialEventParser } from './base-parser';
export {
  extractTag,
  extractTagAsNumber,
  extractAllGroups,
  extractGroup,
  unescapeXml,
} from './base-parser';

export { S5001Parser } from './s5001-parser';
export type { S5001Output, S5001InfoCpCalc, S5001IdeEstabLot, S5001InfoCategInc, S5001InfoBaseCS } from './s5001-parser';

export { S5002Parser } from './s5002-parser';
export type { S5002Output, S5002InfoIRComplem, S5002IdeEstabLot, S5002InfoIRItem, S5002InfoDep } from './s5002-parser';

export { S5003Parser } from './s5003-parser';
export type { S5003Output, S5003InfoFGTS, S5003InfoFGTSEstab, S5003InfoBasePerApur } from './s5003-parser';

export { S5011Parser } from './s5011-parser';
export type { S5011Output, S5011InfoCS, S5011IdeEstab, S5011InfoCRContrib, S5011InfoComplObra } from './s5011-parser';

export { S5012Parser } from './s5012-parser';
export type { S5012Output, S5012InfoIR, S5012InfoIRCR } from './s5012-parser';

export { S5013Parser } from './s5013-parser';
export type { S5013Output, S5013InfoDpsFGTS, S5013InfoTotEstab, S5013InfoTrabFGTS } from './s5013-parser';
