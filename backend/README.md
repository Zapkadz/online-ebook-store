# E-Book Store Backend

## Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn
- Git

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install
```

### Step 2: Database Setup
```bash
# Create MySQL Database
mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE google_play_books;
USE google_play_books;

# Exit MySQL console
exit;
```

### Step 3: Environment Setup
```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

Required environment variables:
```env
NODE_ENV=development
PORT=5000
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=google_play_books
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_key
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
```

### Step 4: Initialize Database
```bash
# Run database setup script
npm run setup-db
```

### Step 5: Start the Server
```bash
# Development mode
npm run dev

# OR Production mode
npm run build
npm start
```

The server will be running at `http://localhost:5000`

## Testing the Setup

### 1. Check API Documentation
Open your browser and visit:
```
http://localhost:5000/api
```

### 2. Test Admin Login
Using curl or Postman:
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ebooks.com","password":"admin123"}'
```

### 3. Test File Upload
```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=@/path/to/book.pdf" \
  -F "coverImage=@/path/to/cover.jpg"
```

## Troubleshooting

### Common Issues and Solutions

1. Database Connection Errors
```bash
# Check MySQL service is running
sudo service mysql status

# Verify database credentials
mysql -u root -p

# Check database exists
SHOW DATABASES;
```

2. File Upload Issues
```bash
# Check uploads directory exists and has correct permissions
mkdir -p uploads
chmod 755 uploads
```

3. TypeScript Compilation Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

4. Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Logging

Check logs for detailed error information:
```bash
# Error logs
cat logs/error.log

# All logs
cat logs/combined.log
```

## Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── scripts/        # Utility scripts
├── services/       # Business logic
├── types/          # TypeScript definitions
├── utils/          # Utility functions
└── index.ts        # Application entry
```

## Development

### Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production server
npm run setup-db   # Initialize database
npm test          # Run tests
npm run lint      # Check code style
npm run lint:fix  # Fix code style
```

### Making Changes
1. Create a new branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Commit changes
6. Submit pull request

## Deployment

### Production Build
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start production server
npm start
```

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start dist/index.js --name ebook-store

# Monitor the application
pm2 monit
```

## Support

For issues and support:
1. Check the error logs in `logs/error.log`
2. Review the troubleshooting section above
3. Open an issue in the repository
4. Contact the development team