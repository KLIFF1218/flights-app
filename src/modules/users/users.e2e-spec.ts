import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('Users E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let container: StartedPostgreSqlContainer;
  let redis: StartedTestContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('testdb')
      .withUsername('test')
      .withPassword('test')
      .start();
    console.log('container is ready');

    process.env.DATABASE_URL = container.getConnectionUri();

    redis = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redis.getHost();
    const redisPort = redis.getMappedPort(6379);

    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);
    console.log('env is ready url');

    execSync('pnpm prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: container.getConnectionUri(),
      },
      stdio: 'inherit',
    });
    console.log('execsync is ready');

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    await container.stop();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('POST /users — должен создавать пользователя', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@mail.com',
        password: '123456',
        fullName: 'John Doe',
      })
      .expect(201);

    expect(res.body.email).toBe('test@mail.com');
  });

  it('GET /users — должен вернуть пустой список', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);

    expect(res.body.data).toEqual([]);
  });

  it('GET /users/:id — должен вернуть пользователя по ID', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'john@mail.com',
        password: 'hidden',
        fullName: 'John',
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .expect(200);

    expect(res.body.id).toBe(user.id);
  });

  it('DELETE /users/:id — должен удалять пользователя', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'delete@mail.com',
        password: 'test',
        fullName: 'Del User',
      },
    });

    await request(app.getHttpServer()).delete(`/users/${user.id}`).expect(200);

    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();
  });
});
