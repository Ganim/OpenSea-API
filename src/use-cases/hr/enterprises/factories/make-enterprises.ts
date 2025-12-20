import { PrismaEnterprisesRepository } from '@/repositories/hr/prisma/prisma-enterprises-repository';
import { CreateEnterpriseUseCase } from '../create-enterprise';
import { DeleteEnterpriseUseCase } from '../delete-enterprise';
import { GetEnterpriseByIdUseCase } from '../get-enterprise-by-id';
import { GetEnterpriseByCnpjUseCase } from '../get-enterprise-by-cnpj';
import { ListEnterprisesUseCase } from '../list-enterprises';
import { RestoreEnterpriseUseCase } from '../restore-enterprise';
import { UpdateEnterpriseUseCase } from '../update-enterprise';

export function makeCreateEnterpriseUseCase(): CreateEnterpriseUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new CreateEnterpriseUseCase(enterprisesRepository);
}

export function makeGetEnterpriseByIdUseCase(): GetEnterpriseByIdUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new GetEnterpriseByIdUseCase(enterprisesRepository);
}

export function makeGetEnterpriseByCnpjUseCase(): GetEnterpriseByCnpjUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new GetEnterpriseByCnpjUseCase(enterprisesRepository);
}

export function makeListEnterprisesUseCase(): ListEnterprisesUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new ListEnterprisesUseCase(enterprisesRepository);
}

export function makeUpdateEnterpriseUseCase(): UpdateEnterpriseUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new UpdateEnterpriseUseCase(enterprisesRepository);
}

export function makeDeleteEnterpriseUseCase(): DeleteEnterpriseUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new DeleteEnterpriseUseCase(enterprisesRepository);
}

export function makeRestoreEnterpriseUseCase(): RestoreEnterpriseUseCase {
  const enterprisesRepository = new PrismaEnterprisesRepository();
  return new RestoreEnterpriseUseCase(enterprisesRepository);
}
