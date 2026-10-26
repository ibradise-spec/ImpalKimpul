import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} wajib diisi`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 16) {
  throw new Error('JWT_SECRET minimal 16 karakter');
}

const nodeEnv = process.env.NODE_ENV || 'development';
const port = Number(process.env.PORT) || 3000;

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: '8h',
  cookieMaxAgeMs: 8 * 60 * 60 * 1000,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  aiServiceUrl: (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
  aiMode: process.env.AI_MODE === 'remote' ? 'remote' : 'mock',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 15000,
  aiMockDelayMs: process.env.AI_MOCK_DELAY_MS !== undefined ? Number(process.env.AI_MOCK_DELAY_MS) || 0 : 700,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
};
