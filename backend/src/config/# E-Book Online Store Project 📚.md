# E-Book Online Store Backend

This is the backend service for the E-Book Online Store, providing APIs for user management, book management, payments, and AI-powered features.

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── config.ts    # Environment and app configuration
│   └── database.ts  # Database connection setup
├── controllers/     # Request handlers
│   ├── bookController.ts
│   ├── chatbotController.ts
│   ├── paymentController.ts
│   └── userController.ts
├── middleware/      # Express middleware
│   └── authMiddleware.ts
├── models/         # Database models
│   ├── bookModel.ts
│   └── userModel.ts
├── routes/         # API routes
│   ├── bookRoutes.ts
│   ├── chatbotRoutes.ts
│   ├── paymentRoutes.ts
│   └── userRoutes.ts
├── scripts/        # Utility scripts
│   └── setupDatabase.ts
├── services/       # Business logic and external services
│   ├── openaiService.ts
│   └── stripeService.ts
├── types/          # TypeScript type definitions
│   └── express/
├── utils/          # Utility functions
│   ├── errorHandler.ts
│   ├── fileUpload.ts
│   └── logger.ts
└── index.ts        # Application entry point
```

## Key Features

- User Authentication and Authorization
- Book Management (CRUD operations)
- File Upload Support (AWS S3)
- Payment Processing (Stripe)
- AI-powered Chatbot (OpenAI)
- Real-time Notifications (Socket.IO)

## API Endpoints

### Users
- POST /api/users/register
- POST /api/users/login
- GET /api/users/profile
- PUT /api/users/profile

### Books
- GET /api/books
- GET /api/books/:id
- POST /api/books
- PUT /api/books/:id
- DELETE /api/books/:id

### Chatbot
- POST /api/chatbot/support
- POST /api/chatbot/recommendations
- POST /api/chatbot/summary
- POST /api/chatbot/analyze-sentiment
- POST /api/chatbot/reading-insights

### Payments
- POST /api/payment/create-payment-intent
- POST /api/payment/webhook
- POST /api/payment/customers
- POST /api/payment/customers/:customerId/payment-methods
- GET /api/payment/customers/:customerId/payment-methods
- POST /api/payment/refunds

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up the database:
   ```bash
   npm run setup-db
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables:

```
NODE_ENV=development
PORT=5000
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=google_play_books
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
OPENAI_API_KEY=your_openai_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name
```

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run setup-db`: Set up database with initial data
- `npm test`: Run tests
- `npm run lint`: Run linting

## Error Handling

The application uses a centralized error handling system:

- `AppError`: Base error class for operational errors
- `ValidationError`: For data validation errors
- `AuthenticationError`: For authentication failures
- `AuthorizationError`: For permission issues
- `NotFoundError`: For resource not found errors

## Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Rate Limiting
- CORS Protection
- XSS Protection (helmet)
- Request Validation (zod)
- Secure File Upload
- Stripe Webhook Verification

## Logging

The application uses Winston for logging with different levels:

- ERROR: For error conditions
- WARN: For warning conditions
- INFO: For informational messages
- HTTP: For HTTP request logging
- DEBUG: For debug messages

Logs are stored in:
- `logs/error.log`: For error messages
- `logs/combined.log`: For all messages

## Testing

Run tests with:
```bash
npm test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is proprietary and confidential.