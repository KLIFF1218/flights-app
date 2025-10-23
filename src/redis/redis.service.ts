import { Injectable } from "@nestjs/common";

@Injectable()

export class RedisService {
  constructor(private readonly configService: Config)
}