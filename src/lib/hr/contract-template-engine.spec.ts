import { describe, expect, it } from 'vitest';
import {
  renderTemplate,
  templateReferences,
} from './contract-template-engine';

describe('contract template engine', () => {
  describe('renderTemplate — placeholders', () => {
    it('replaces a top-level placeholder with the corresponding value', () => {
      const rendered = renderTemplate('Olá, {{name}}!', { name: 'Joana' });
      expect(rendered).toBe('Olá, Joana!');
    });

    it('resolves nested paths via dot notation', () => {
      const rendered = renderTemplate(
        'Funcionário: {{employee.fullName}} — Cargo: {{position.title}}',
        {
          employee: { fullName: 'Carlos Mendes' },
          position: { title: 'Analista de Sistemas' },
        },
      );
      expect(rendered).toBe(
        'Funcionário: Carlos Mendes — Cargo: Analista de Sistemas',
      );
    });

    it('renders unknown placeholders as empty strings instead of throwing', () => {
      const rendered = renderTemplate('Salário: {{employee.baseSalary}}', {
        employee: {},
      });
      expect(rendered).toBe('Salário: ');
    });

    it('serializes object values as JSON when no formatter is given', () => {
      const rendered = renderTemplate('Meta: {{metadata}}', {
        metadata: { foo: 'bar' },
      });
      expect(rendered).toBe('Meta: {"foo":"bar"}');
    });

    it('tolerates extra whitespace inside the placeholder braces', () => {
      const rendered = renderTemplate('Hi {{   employee.firstName   }}', {
        employee: { firstName: 'Lia' },
      });
      expect(rendered).toBe('Hi Lia');
    });
  });

  describe('renderTemplate — formatters', () => {
    it('formats dates in BR locale by default', () => {
      const admissionDate = new Date('2024-03-15T12:00:00Z');
      const rendered = renderTemplate(
        'Admitido em {{date:BR|employee.hireDate}}',
        { employee: { hireDate: admissionDate } },
      );
      expect(rendered).toContain('15/03/2024');
    });

    it('supports ISO date format', () => {
      const rendered = renderTemplate('{{date:ISO|today}}', {
        today: '2026-04-16T08:00:00Z',
      });
      expect(rendered).toBe('2026-04-16');
    });

    it('formats numbers as BRL currency', () => {
      const rendered = renderTemplate(
        'Salário: {{currency:employee.baseSalary}}',
        { employee: { baseSalary: 4500.5 } },
      );
      expect(rendered).toContain('R$');
      expect(rendered).toContain('4.500,50');
    });

    it('uppercases and lowercases looked-up strings', () => {
      const rendered = renderTemplate(
        '{{upper:tenant.name}} / {{lower:tenant.name}}',
        { tenant: { name: 'Acme Corp' } },
      );
      expect(rendered).toBe('ACME CORP / acme corp');
    });

    it('renders empty string when currency receives an invalid value', () => {
      const rendered = renderTemplate('{{currency:salary}}', {
        salary: 'not-a-number',
      });
      expect(rendered).toBe('');
    });
  });

  describe('renderTemplate — conditional blocks', () => {
    it('renders {{#if}} block when value is truthy', () => {
      const template =
        '{{#if employee.hasBenefits}}Inclui benefícios{{/if}}';
      const rendered = renderTemplate(template, {
        employee: { hasBenefits: true },
      });
      expect(rendered).toBe('Inclui benefícios');
    });

    it('omits {{#if}} block when value is falsy', () => {
      const template =
        'Antes {{#if employee.hasBenefits}}Inclui benefícios{{/if}} depois';
      const rendered = renderTemplate(template, {
        employee: { hasBenefits: false },
      });
      expect(rendered).toBe('Antes  depois');
    });

    it('renders {{#unless}} block when value is falsy', () => {
      const template = '{{#unless probation}}Sem período de experiência{{/unless}}';
      const rendered = renderTemplate(template, { probation: false });
      expect(rendered).toBe('Sem período de experiência');
    });

    it('handles nested conditionals', () => {
      const template =
        '{{#if employee.active}}Ativo{{#if employee.remote}} - Remoto{{/if}}{{/if}}';
      const rendered = renderTemplate(template, {
        employee: { active: true, remote: true },
      });
      expect(rendered).toBe('Ativo - Remoto');
    });
  });

  describe('templateReferences', () => {
    it('detects whether a placeholder path is referenced in the content', () => {
      const content = 'Hi {{employee.fullName}} - {{date:BR|today}}';
      expect(templateReferences(content, 'employee.fullName')).toBe(true);
      expect(templateReferences(content, 'today')).toBe(true);
      expect(templateReferences(content, 'employee.cpf')).toBe(false);
    });
  });
});
