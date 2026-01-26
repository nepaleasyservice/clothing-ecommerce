import databaseConfig from './database.config';
import googleConfig from './google.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';

export default [
  databaseConfig,
  redisConfig,
  jwtConfig,
  googleConfig,
]