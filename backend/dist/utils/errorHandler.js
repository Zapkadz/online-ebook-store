"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDatabaseError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.asyncHandler = exports.notFound = exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("./logger");
const zod_1 = require("zod");
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    const response = {
        success: false,
        message: 'Internal Server Error'
    };
    // Handle specific error types
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        response.message = err.message;
    }
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        response.message = 'Validation Error';
        response.errors = err.errors;
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        response.message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        response.message = 'Token expired';
    }
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        logger_1.logger.error(`${err.name}: ${err.message}\n${err.stack}`);
    }
    else {
        logger_1.logger.error(`${err.name}: ${err.message}`);
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
// Error handlers for specific scenarios
const notFound = (req, res, next) => {
    const error = new AppError(404, `Resource not found - ${req.originalUrl}`);
    next(error);
};
exports.notFound = notFound;
const asyncHandler = (fn) => (...args) => Promise.resolve(fn(...args)).catch(args[2]);
exports.asyncHandler = asyncHandler;
// Custom error types
class ValidationError extends AppError {
    constructor(message) {
        super(400, message);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(401, message);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Permission denied') {
        super(403, message);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(409, message);
    }
}
exports.ConflictError = ConflictError;
// Database error handler
const handleDatabaseError = (error) => {
    logger_1.logger.error('Database Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Duplicate entry');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW') {
        throw new ValidationError('Invalid reference');
    }
    throw new AppError(500, 'Database error occurred');
};
exports.handleDatabaseError = handleDatabaseError;
//# sourceMappingURL=errorHandler.js.map