import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFormFieldsRepository } from '@/repositories/sales/in-memory/in-memory-form-fields-repository';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFormUseCase } from './create-form';

let formsRepository: InMemoryFormsRepository;
let formFieldsRepository: InMemoryFormFieldsRepository;
let createForm: CreateFormUseCase;

describe('CreateFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    formFieldsRepository = new InMemoryFormFieldsRepository();
    createForm = new CreateFormUseCase(formsRepository, formFieldsRepository);
  });

  it('should create a form with fields', async () => {
    const result = await createForm.execute({
      tenantId: 'tenant-1',
      title: 'Contact Form',
      description: 'A simple contact form',
      createdBy: 'user-1',
      fields: [
        { label: 'Name', type: 'TEXT', isRequired: true, order: 0 },
        { label: 'Email', type: 'EMAIL', isRequired: true, order: 1 },
        { label: 'Message', type: 'TEXTAREA', order: 2 },
      ],
    });

    expect(result.form).toBeDefined();
    expect(result.form.title).toBe('Contact Form');
    expect(result.form.status).toBe('DRAFT');
    expect(result.form.fields).toHaveLength(3);
  });

  it('should not allow empty title', async () => {
    await expect(() =>
      createForm.execute({
        tenantId: 'tenant-1',
        title: '',
        createdBy: 'user-1',
        fields: [{ label: 'Name', type: 'TEXT', order: 0 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow title exceeding 255 characters', async () => {
    await expect(() =>
      createForm.execute({
        tenantId: 'tenant-1',
        title: 'A'.repeat(256),
        createdBy: 'user-1',
        fields: [{ label: 'Name', type: 'TEXT', order: 0 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow form without fields', async () => {
    await expect(() =>
      createForm.execute({
        tenantId: 'tenant-1',
        title: 'Empty Form',
        createdBy: 'user-1',
        fields: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
