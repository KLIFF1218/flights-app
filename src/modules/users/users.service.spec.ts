import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const user = {
  email: 'sfasff@gma.com',
  fullName: 'Max',
  password: 'password_123',
};

const responseUser = {
  id: '123456',
  email: 'sfasff@gma.com',
  fullName: 'Max',
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('определен ли сервис', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('должен найти пользователя по его ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(responseUser);
      const result = await service.getById('123456');

      expect(result).toEqual(responseUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: responseUser.id,
        },
      });
    });
  });

  describe('create', () => {
    it('должен создавать пользователя', async () => {
      mockPrismaService.user.create.mockResolvedValue(responseUser);

      const result = await service.create(user);

      expect(result).toEqual({
        ...responseUser,
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: user,
      });
    });
  });

  describe('getAll', () => {
    it('должен найти всех пользователей', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([responseUser]);
      const users = await service.getAll();

      expect(users).toEqual([responseUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('долежн удалить пользователя по его ID', async () => {
      mockPrismaService.user.delete.mockResolvedValue(responseUser);

      const deletedUser = await service.remove('123456');
      expect(deletedUser).toEqual(responseUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: {
          id: '123456',
        },
      });
    });
  });
});
