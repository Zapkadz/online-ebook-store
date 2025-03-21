"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config();
// Log environment variables (for debugging)
console.log('Environment variables loaded:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_NAME: process.env.DATABASE_NAME
});
// Environment variables schema
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('5000'),
    DATABASE_HOST: zod_1.z.string().default('localhost'),
    DATABASE_USER: zod_1.z.string().default('root'),
    DATABASE_PASSWORD: zod_1.z.string().default(''),
    DATABASE_NAME: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().default('your_secret_key'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000')
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
        ],
        uploadDir: path_1.default.join(process.cwd(), 'uploads')
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: path_1.default.join(process.cwd(), 'logs')
    }
};
// Ensure required environment variables are present
if (!env.DATABASE_NAME) {
    throw new Error('DATABASE_NAME is required in environment variables');
}
exports.default = config;
//# sourceMappingURL=config.js.map