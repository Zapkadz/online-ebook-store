import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Log environment variables (for debugging)
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_HOST: process.env.DATABASE_HOST,
  DATABASE_USER: process.env.DATABASE_USER,
  DATABASE_NAME: process.env.DATABASE_NAME
});

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_USER: z.string().default('root'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string(),
  JWT_SECRET: z.string().default('your_secret_key'),
  FRONTEND_URL: z.string().default('http://localhost:3000')
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  database: {
    host: env.DATABASE_HOST,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    name: env.DATABASE_NAME,
    connectionLimit: 10
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '24h'
  },

  cors: {
    origin: env.FRONTEND_URL,
    credentials: true
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later'
  },

  // Optional external services
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || '',
    bucketName: process.env.AWS_BUCKET_NAME || ''
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },

  upload: {
    maxSize: '10mb',
    allowedTypes: [
      'application/pdf',
      'application/epub+zip',
      'image/jpeg',
      'image/png'
    ] as const,
    uploadDir: path.join(process.cwd(), 'uploads')
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: path.join(process.cwd(), 'logs')
  }
} as const;

// Type definitions
export type Config = typeof config;

// Ensure required environment variables are present
if (!env.DATABASE_NAME) {
  throw new Error('DATABASE_NAME is required in environment variables');
}

export default config;