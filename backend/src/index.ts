import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import config from './config/config';
import { logger, stream } from './utils/logger';
import { errorHandler, notFound } from './utils/errorHandler';
import { testConnection } from './config/database';

// Import routes
import userRoutes from './routes/userRoutes';
import bookRoutes from './routes/bookRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Request logging
app.use(morgan('combined', { stream }));

// Configure and apply rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: config.rateLimit.message
});

// Apply rate limiting to all routes except webhook
app.use((req, res, next) => {
  if (req.path === '/api/payment/webhook') {
    return next();
  }
  return limiter(req, res, next);
});

// Body parsing middleware
// Use raw body for Stripe webhook
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
// Use JSON parser for other routes
app.use(express.json({ limit: config.upload.maxSize }));
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Test database connection
testConnection().catch((error) => {
  logger.error('Database connection failed:', error);
  process.exit(1);
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to E-Book Store API',
    documentationUrl: '/api',
    version: '1.0',
    status: 'Online',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/payment', paymentRoutes);

// API documentation route
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'E-Book Store API Documentation',
    version: '1.0',
    server: {
      environment: config.env,
      timestamp: new Date().toISOString()
    },
    endpoints: {
      root: {
        base: '/',
        description: 'API status and information'
      },
      users: {
        base: '/api/users',
        endpoints: {
          register: 'POST /register',
          login: 'POST /login',
          profile: 'GET /profile',
          updateProfile: 'PUT /profile'
        }
      },
      books: {
        base: '/api/books',
        endpoints: {
          list: 'GET /',
          getById: 'GET /:id',
          create: 'POST /',
          update: 'PUT /:id',
          delete: 'DELETE /:id'
        }
      },
      chatbot: {
        base: '/api/chatbot',
        endpoints: {
          support: 'POST /support',
          recommendations: 'POST /recommendations',
          summary: 'POST /summary',
          analyzeSentiment: 'POST /analyze-sentiment',
          readingInsights: 'POST /reading-insights'
        }
      },
      payment: {
        base: '/api/payment',
        endpoints: {
          createPaymentIntent: 'POST /create-payment-intent',
          webhook: 'POST /webhook',
          customers: 'POST /customers',
          attachPaymentMethod: 'POST /customers/:customerId/payment-methods',
          listPaymentMethods: 'GET /customers/:customerId/payment-methods',
          createRefund: 'POST /refunds'
        }
      }
    }
  });
});

// Handle favicon.ico request
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end();
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Handle real-time notifications
  socket.on('join-notification-room', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.debug(`User ${userId} joined notification room`);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`API Documentation available at: http://localhost:${PORT}/api`);
});