"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("./config/config"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./utils/errorHandler");
const database_1 = require("./config/database");
// Import routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const bookRoutes_1 = __importDefault(require("./routes/bookRoutes"));
const chatbotRoutes_1 = __importDefault(require("./routes/chatbotRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
// Initialize express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Configure Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: config_1.default.cors.origin,
        methods: ['GET', 'POST']
    }
});
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(config_1.default.cors));
// Request logging
app.use((0, morgan_1.default)('combined', { stream: logger_1.stream }));
// Configure and apply rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimit.windowMs,
    max: config_1.default.rateLimit.max,
    standardHeaders: config_1.default.rateLimit.standardHeaders,
    legacyHeaders: config_1.default.rateLimit.legacyHeaders,
    message: config_1.default.rateLimit.message
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
app.use('/api/payment/webhook', express_1.default.raw({ type: 'application/json' }));
// Use JSON parser for other routes
app.use(express_1.default.json({ limit: config_1.default.upload.maxSize }));
app.use(express_1.default.urlencoded({ extended: true }));
// Static file serving
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Test database connection
(0, database_1.testConnection)().catch((error) => {
    logger_1.logger.error('Database connection failed:', error);
    process.exit(1);
});
// API Routes
app.use('/api/users', userRoutes_1.default);
app.use('/api/books', bookRoutes_1.default);
app.use('/api/chatbot', chatbotRoutes_1.default);
app.use('/api/payment', paymentRoutes_1.default);
// API documentation route
app.get('/api', (req, res) => {
    res.json({
        message: 'E-Book Store API',
        version: '1.0',
        endpoints: {
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
// 404 handler
app.use(errorHandler_1.notFound);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// WebSocket connection handling
io.on('connection', (socket) => {
    logger_1.logger.info(`User connected: ${socket.id}`);
    // Handle real-time notifications
    socket.on('join-notification-room', (userId) => {
        socket.join(`user-${userId}`);
        logger_1.logger.debug(`User ${userId} joined notification room`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`User disconnected: ${socket.id}`);
    });
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
});
// Start server
const PORT = config_1.default.port;
httpServer.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${config_1.default.env}`);
    logger_1.logger.info(`API Documentation available at: http://localhost:${PORT}/api`);
});
//# sourceMappingURL=index.js.map