import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { AppModule } from 'src/app.module';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('Airports E2E', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let token: string;
  let airportId: string;
  let redis: StartedTestContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withUsername('test')
      .withPassword('test')
      .withDatabase('testdb')
      .start();

    redis = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redis.getHost();
    const redisPort = redis.getMappedPort(6379);

    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);

    process.env.DATABASE_URL = container.getConnectionUri();

    execSync('pnpm prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: container.getConnectionUri(),
      },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const auth = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
        fullName: 'Max',
      });

    token = auth.body.accessToken;
  }, 120000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('POST /airports (create)', async () => {
    const dto = {
      code: 'SVO',
      name: 'Sheremetyevo',
      city: 'Moscow',
      country: 'Russia',
    };

    const res = await request(app.getHttpServer())
      .post('/airports')
      .set('Authorization', `Bearer ${token}`)
      .send(dto)
      .expect(201);

    expect(res.body).toMatchObject({
      code: dto.code,
      name: dto.name,
      city: dto.city,
      country: dto.country,
    });

    airportId = res.body.id;
  });

  it('GET /airports (findAll)', async () => {
    const res = await request(app.getHttpServer())
      .get('/airports')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /airports/:id (findOne)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/airports/${airportId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(airportId);
  });

  it('PATCH /airports/:id (update)', async () => {
    const dto = { city: 'Moscow City Updated' };

    const res = await request(app.getHttpServer())
      .patch(`/airports/${airportId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dto)
      .expect(200);

    expect(res.body.city).toBe(dto.city);
  });

  it('DELETE /airports/:id (remove)', async () => {
    await request(app.getHttpServer())
      .delete(`/airports/${airportId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/airports/${airportId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
