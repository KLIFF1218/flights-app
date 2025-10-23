import { Module } from '@nestjs/common';

@Module({
  providers: [RedisSer]
})

export class RedisModule {}