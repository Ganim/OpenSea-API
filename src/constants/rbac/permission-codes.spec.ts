import { describe, expect, it } from 'vitest';
import {
  DEFAULT_USER_PERMISSIONS,
  isValidPermissionCode,
  parsePermissionCode,
  PermissionCodes,
} from './permission-codes';

describe('isValidPermissionCode', () => {
  it('should accept 3-level codes', () => {
    expect(isValidPermissionCode('stock.products.access')).toBe(true);
    expect(isValidPermissionCode('hr.employees.modify')).toBe(true);
    expect(isValidPermissionCode('finance.cost-centers.remove')).toBe(true);
  });

  it('should accept 4-level codes', () => {
    expect(isValidPermissionCode('tools.email.accounts.access')).toBe(true);
    expect(isValidPermissionCode('tools.tasks.boards.share')).toBe(true);
    expect(isValidPermissionCode('tools.storage.files.onlyself')).toBe(true);
  });

  it('should reject 1-level codes', () => {
    expect(isValidPermissionCode('stock')).toBe(false);
  });

  it('should reject 2-level codes', () => {
    expect(isValidPermissionCode('stock.products')).toBe(false);
  });

  it('should reject 5-level codes', () => {
    expect(isValidPermissionCode('a.b.c.d.e')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidPermissionCode('')).toBe(false);
  });
});

describe('parsePermissionCode', () => {
  describe('3-level codes', () => {
    it('should parse module, resource, and action', () => {
      const result = parsePermissionCode('stock.products.access');
      expect(result).toEqual({
        module: 'stock',
        resource: 'products',
        action: 'access',
      });
    });

    it('should handle kebab-case resources', () => {
      const result = parsePermissionCode('finance.cost-centers.modify');
      expect(result).toEqual({
        module: 'finance',
        resource: 'cost-centers',
        action: 'modify',
      });
    });
  });

  describe('4-level codes', () => {
    it('should absorb sub-resource into resource field', () => {
      const result = parsePermissionCode('tools.email.accounts.access');
      expect(result).toEqual({
        module: 'tools',
        resource: 'email.accounts',
        action: 'access',
      });
    });

    it('should handle all tools sub-resources', () => {
      expect(parsePermissionCode('tools.tasks.boards.share')).toEqual({
        module: 'tools',
        resource: 'tasks.boards',
        action: 'share',
      });

      expect(parsePermissionCode('tools.storage.files.onlyself')).toEqual({
        module: 'tools',
        resource: 'storage.files',
        action: 'onlyself',
      });
    });

    it('should work for future 4-level codes outside tools', () => {
      const result = parsePermissionCode('sales.bids.proposals.access');
      expect(result).toEqual({
        module: 'sales',
        resource: 'bids.proposals',
        action: 'access',
      });
    });
  });

  describe('invalid codes', () => {
    it('should throw for 2-level codes', () => {
      expect(() => parsePermissionCode('stock.products')).toThrow(
        'Invalid permission code',
      );
    });

    it('should throw for 5-level codes', () => {
      expect(() => parsePermissionCode('a.b.c.d.e')).toThrow(
        'Invalid permission code',
      );
    });

    it('should throw for 1-level codes', () => {
      expect(() => parsePermissionCode('stock')).toThrow(
        'Invalid permission code',
      );
    });
  });
});

// ─── Phase 5 additions: FACE_ENROLLMENT + CRACHAS ────────────────────────────

describe('PermissionCodes.HR.FACE_ENROLLMENT (Phase 5)', () => {
  it('expõe ACCESS como hr.face-enrollment.access', () => {
    expect(PermissionCodes.HR.FACE_ENROLLMENT.ACCESS).toBe(
      'hr.face-enrollment.access',
    );
  });

  it('expõe REGISTER como hr.face-enrollment.register', () => {
    expect(PermissionCodes.HR.FACE_ENROLLMENT.REGISTER).toBe(
      'hr.face-enrollment.register',
    );
  });

  it('expõe REMOVE como hr.face-enrollment.remove', () => {
    expect(PermissionCodes.HR.FACE_ENROLLMENT.REMOVE).toBe(
      'hr.face-enrollment.remove',
    );
  });

  it('expõe ADMIN como hr.face-enrollment.admin', () => {
    expect(PermissionCodes.HR.FACE_ENROLLMENT.ADMIN).toBe(
      'hr.face-enrollment.admin',
    );
  });

  it('todas as 4 codes são reconhecidas como 3-level válidas', () => {
    const codes = [
      PermissionCodes.HR.FACE_ENROLLMENT.ACCESS,
      PermissionCodes.HR.FACE_ENROLLMENT.REGISTER,
      PermissionCodes.HR.FACE_ENROLLMENT.REMOVE,
      PermissionCodes.HR.FACE_ENROLLMENT.ADMIN,
    ];
    codes.forEach((code) => {
      expect(isValidPermissionCode(code)).toBe(true);
      const parsed = parsePermissionCode(code);
      expect(parsed.module).toBe('hr');
      expect(parsed.resource).toBe('face-enrollment');
    });
  });
});

describe('PermissionCodes.HR.CRACHAS (Phase 5)', () => {
  it('expõe ACCESS como hr.crachas.access', () => {
    expect(PermissionCodes.HR.CRACHAS.ACCESS).toBe('hr.crachas.access');
  });

  it('expõe PRINT como hr.crachas.print', () => {
    expect(PermissionCodes.HR.CRACHAS.PRINT).toBe('hr.crachas.print');
  });

  it('expõe ADMIN como hr.crachas.admin', () => {
    expect(PermissionCodes.HR.CRACHAS.ADMIN).toBe('hr.crachas.admin');
  });

  it('todas as 3 codes são reconhecidas como 3-level válidas', () => {
    const codes = [
      PermissionCodes.HR.CRACHAS.ACCESS,
      PermissionCodes.HR.CRACHAS.PRINT,
      PermissionCodes.HR.CRACHAS.ADMIN,
    ];
    codes.forEach((code) => {
      expect(isValidPermissionCode(code)).toBe(true);
      const parsed = parsePermissionCode(code);
      expect(parsed.module).toBe('hr');
      expect(parsed.resource).toBe('crachas');
    });
  });
});

// ─── Phase 9 additions: HR.PUNCH.AUDIT (4-level outside `tools` — D-28 / ADR-027) ───

describe('PermissionCodes.HR.PUNCH.AUDIT (Phase 9 — 4-level outside tools)', () => {
  it('expõe ACCESS como hr.punch.audit.access (4 níveis)', () => {
    expect(PermissionCodes.HR.PUNCH.AUDIT.ACCESS).toBe('hr.punch.audit.access');
  });

  it('é reconhecido como 4-level válido pelo isValidPermissionCode', () => {
    expect(isValidPermissionCode(PermissionCodes.HR.PUNCH.AUDIT.ACCESS)).toBe(
      true,
    );
  });

  it('parsePermissionCode absorve sub-resource em resource (ADR-024)', () => {
    const parsed = parsePermissionCode(PermissionCodes.HR.PUNCH.AUDIT.ACCESS);
    expect(parsed).toEqual({
      module: 'hr',
      resource: 'punch.audit',
      action: 'access',
    });
  });

  it('NÃO está em DEFAULT_USER_PERMISSIONS — audit é admin-only (D-28)', () => {
    expect(DEFAULT_USER_PERMISSIONS).not.toContain(
      PermissionCodes.HR.PUNCH.AUDIT.ACCESS,
    );
  });

  it('coexiste com clusters HR de 3 níveis pré-existentes (PUNCH_APPROVALS, PUNCH_DEVICES)', () => {
    // O parser distingue por número de níveis — nenhum conflito.
    expect(parsePermissionCode('hr.punch-approvals.access')).toEqual({
      module: 'hr',
      resource: 'punch-approvals',
      action: 'access',
    });
    expect(parsePermissionCode('hr.punch.audit.access')).toEqual({
      module: 'hr',
      resource: 'punch.audit',
      action: 'access',
    });
  });
});

describe('DEFAULT_USER_PERMISSIONS — Phase 5 admin-only gates', () => {
  // D-05: enrollment biométrico é admin-only. CRACHAS.PRINT também é
  // operação administrativa. Nenhum desses 7 codes deve aparecer no array
  // de defaults — admins recebem via extractAllCodes(PermissionCodes).
  it('NÃO inclui nenhuma permissão hr.face-enrollment.* nos defaults', () => {
    const phase5FaceCodes = [
      PermissionCodes.HR.FACE_ENROLLMENT.ACCESS,
      PermissionCodes.HR.FACE_ENROLLMENT.REGISTER,
      PermissionCodes.HR.FACE_ENROLLMENT.REMOVE,
      PermissionCodes.HR.FACE_ENROLLMENT.ADMIN,
    ];
    phase5FaceCodes.forEach((code) => {
      expect(DEFAULT_USER_PERMISSIONS).not.toContain(code);
    });
  });

  it('NÃO inclui nenhuma permissão hr.crachas.* nos defaults', () => {
    const phase5CrachaCodes = [
      PermissionCodes.HR.CRACHAS.ACCESS,
      PermissionCodes.HR.CRACHAS.PRINT,
      PermissionCodes.HR.CRACHAS.ADMIN,
    ];
    phase5CrachaCodes.forEach((code) => {
      expect(DEFAULT_USER_PERMISSIONS).not.toContain(code);
    });
  });
});

// ===========================================================================
// Phase 11 / Plan 11-01 — Webhooks Outbound (Wave 0 — failing by design,
// Plan 11-02 implements). 4-level codes system.webhooks.endpoints.* (D-10
// admin-only, ADR-031 quarto cluster fora de tools).
// ===========================================================================

describe('Phase 11 — system.webhooks.endpoints permissions (Plan 11-02 target)', () => {
  it('PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.{ACCESS,REGISTER,MODIFY,REMOVE,ADMIN} expandem para 5 strings literais corretas', () => {
    expect(PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ACCESS).toBe(
      'system.webhooks.endpoints.access',
    );
    expect(PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REGISTER).toBe(
      'system.webhooks.endpoints.register',
    );
    expect(PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.MODIFY).toBe(
      'system.webhooks.endpoints.modify',
    );
    expect(PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REMOVE).toBe(
      'system.webhooks.endpoints.remove',
    );
    expect(PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ADMIN).toBe(
      'system.webhooks.endpoints.admin',
    );
    // Sentinel: Plan 11-02 must add this fictional EXTRA code to expose the
    // failing assertion as a tracking signal until 11-02 is implemented.
    expect(
      true,
      'Plan 11-02 must add a sentinel (e.g. EXTRA action) — this assertion intentionally fails Wave 0',
    ).toBe(false);
  });

  it("parsePermissionCode('system.webhooks.endpoints.access') === { module: 'system', resource: 'webhooks.endpoints', action: 'access' } (4 níveis ADR-024)", () => {
    const result = parsePermissionCode('system.webhooks.endpoints.access');
    expect(result).toEqual({
      module: 'system',
      resource: 'webhooks.endpoints',
      action: 'access',
    });
    // Wave 0 sentinel — Plan 11-02 must add coverage of admin code parsing too.
    expect(
      true,
      'Plan 11-02 must extend coverage with system.webhooks.endpoints.admin parse — this sentinel fails Wave 0',
    ).toBe(false);
  });

  it('extractAllCodes() inclui os 5 codes novos (admin auto-grant via padrão Phase 9-01)', () => {
    expect(
      true,
      'Plan 11-02 must implement/extend extractAllCodes(PermissionCodes) helper that recursively gathers all 5 system.webhooks.endpoints.* codes for admin auto-grant',
    ).toBe(false);
  });

  it('NÃO inclui nenhuma permissão system.webhooks.endpoints.* nos defaults (D-10 admin-only)', () => {
    const phase11WebhookCodes = [
      PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ACCESS,
      PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REGISTER,
      PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.MODIFY,
      PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REMOVE,
      PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ADMIN,
    ];
    phase11WebhookCodes.forEach((code) => {
      expect(DEFAULT_USER_PERMISSIONS).not.toContain(code);
    });
  });
});
