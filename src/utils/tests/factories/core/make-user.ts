import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { CreateUserUseCase } from '@/use-cases/core/users/create-user';

interface makeUserProps {
  email: string;
  password: string;
  username?: string;
  profile?: {
    name?: string;
    surname?: string;
    birthday?: Date;
    location?: string;
    avatarUrl?: string;
  };
  deletedAt?: Date | null;
  usersRepository: InMemoryUsersRepository;
}

export async function makeUser({
  email,
  password,
  username = '',
  profile = {
    name: '',
    surname: '',
    birthday: undefined,
    location: '',
    avatarUrl: '',
  },
  deletedAt = null,
  usersRepository,
}: makeUserProps) {
  const createUserUseCase = new CreateUserUseCase(usersRepository);

  const newMockUser = {
    email,
    password,
    username,
    profile: {
      name: profile.name,
      surname: profile.surname,
      birthday: profile.birthday,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
    },
    deletedAt,
  };

  return await createUserUseCase.execute(newMockUser);
}
