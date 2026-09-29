import fs from 'fs';
import path from 'path';

if (!process.env.JWT_SECRET) {
  const possibleEnvs = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), 'backend/.env')
  ];
  for (const envPath of possibleEnvs) {
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
          break;
        } else {
          const content = fs.readFileSync(envPath, 'utf8');
          content.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
              const key = match[1];
              let value = match[2] || '';
              if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
              if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
              if (!process.env[key]) process.env[key] = value.trim();
            }
          });
          break;
        }
      } catch (e) {
        // ignore fallback errors
      }
    }
  }
}

const pgUser = process.env.POSTGRES_USER || 'admin';
const pgPass = process.env.POSTGRES_PASSWORD || 'root';
const pgHost = process.env.POSTGRES_HOST || 'localhost';
const pgPort = process.env.POSTGRES_PORT || '5432';
const pgDb = process.env.POSTGRES_DB || 'leadassistant';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || `postgres://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${pgDb}`,
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_for_dev_mode_123',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@leadassistant.local',
  },
};
