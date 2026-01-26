import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
export const RedisProvider = {
  provide: 'REDIS_CLIENT',
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const client = createClient({
      url: config.getOrThrow<string>('redis.url'),
    });
    console.log(client);
    client.on('error', (err) => console.log("Redis Error: ", err));
    await client.connect();
    console.log(`
    redis connected successfully
    url: ${config.get('redis.url')}`)
    return client;
  }
}