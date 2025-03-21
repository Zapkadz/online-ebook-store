"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
exports.withTransaction = withTransaction;
exports.buildWhereClause = buildWhereClause;
exports.buildPaginationClause = buildPaginationClause;
exports.tableExists = tableExists;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = __importDefault(require("./config"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
// Log database configuration (for debugging)
logger_1.logger.info('Database config:', {
    host: config_1.default.database.host,
    user: config_1.default.database.user,
    database: config_1.default.database.name
});
// Create the connection pool
const pool = promise_1.default.createPool({
    host: config_1.default.database.host,
    user: config_1.default.database.user,
    password: config_1.default.database.password,
    database: config_1.default.database.name,
    waitForConnections: true,
    connectionLimit: config_1.default.database.connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+00:00', // Set UTC timezone
    dateStrings: true // Return dates as strings
});
exports.pool = pool;
// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        logger_1.logger.info('Database connection successful');
        // Get server version
        const [rows] = await connection.query('SELECT VERSION() as version');
        logger_1.logger.info(`MySQL Server Version: ${rows[0].version}`);
        // Test database access
        await connection.query('SELECT 1');
        logger_1.logger.info('Database access verified');
        connection.release();
    }
    catch (error) {
        logger_1.logger.error('Error connecting to database:', error);
        throw new errorHandler_1.AppError(500, 'Database connection failed');
    }
}
// Utility function to execute transactions
async function withTransaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
// Helper function to build WHERE clauses
function buildWhereClause(conditions) {
    const clauses = [];
    const values = [];
    for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                clauses.push(`${key} IN (?)`);
                values.push(value);
            }
            else if (typeof value === 'object' && value !== null) {
                if ('$like' in value) {
                    clauses.push(`${key} LIKE ?`);
                    values.push(`%${value.$like}%`);
                }
                else if ('$gt' in value) {
                    clauses.push(`${key} > ?`);
                    values.push(value.$gt);
                }
                else if ('$lt' in value) {
                    clauses.push(`${key} < ?`);
                    values.push(value.$lt);
                }
                else if ('$gte' in value) {
                    clauses.push(`${key} >= ?`);
                    values.push(value.$gte);
                }
                else if ('$lte' in value) {
                    clauses.push(`${key} <= ?`);
                    values.push(value.$lte);
                }
            }
            else {
                clauses.push(`${key} = ?`);
                values.push(value);
            }
        }
    }
    return {
        whereClause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
        values
    };
}
function buildPaginationClause(options = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const offset = (page - 1) * limit;
    let orderClause = '';
    if (options.orderBy) {
        orderClause = ` ORDER BY ${options.orderBy} ${options.order || 'ASC'}`;
    }
    return {
        paginationClause: `${orderClause} LIMIT ? OFFSET ?`,
        values: [limit, offset]
    };
}
// Check if table exists
async function tableExists(tableName) {
    const [rows] = await pool.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [config_1.default.database.name, tableName]);
    return rows.length > 0;
}
//# sourceMappingURL=database.js.map