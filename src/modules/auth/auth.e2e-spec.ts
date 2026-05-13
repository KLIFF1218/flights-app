import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { hash } from 'argon2';

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

import { execSync } from 'node:child_process';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('Auth — Integration Tests', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let redis: StartedTestContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('testdb')
      .withUsername('test')
      .withPassword('test')
      .start();

    const dbUrl = container.getConnectionUri();
    process.env.DATABASE_URL = dbUrl;

    redis = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redis.getHost();
    const redisPort = redis.getMappedPort(6379);

    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);

    execSync('pnpm prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  }, 120000);

  afterEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('POST /auth/register — успешная регистрация', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: '12345678',
        fullName: 'Max',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.accessMaxAge).toBeDefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/refreshToken=/);

    const savedRefresh = await prisma.refreshToken.findFirst({
      where: { user: { email: 'test@example.com' } },
    });

    expect(savedRefresh).not.toBeNull();
  });

  it('POST /auth/register — конфликт email', async () => {
    await prisma.user.create({
      data: {
        email: 'a@a.com',
        password: 'hashed',
        fullName: 'X',
      },
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'a@a.com',
        password: '12345678',
        fullName: 'Max',
      })
      .expect(409);
  });

  it('POST /auth/login — успешный логин', async () => {
    const hashed = await hash('12345678');

    await prisma.user.create({
      data: {
        email: 'b@b.com',
        password: hashed,
        fullName: 'User',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'b@b.com',
        password: '12345678',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
  });

  it('POST /auth/login — неверный пароль', async () => {
    const hashed = await hash('correct_pass');

    await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: hashed,
        fullName: 'X',
      },
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@test.com',
        password: 'wrong',
      })
      .expect(404);
  });
});
