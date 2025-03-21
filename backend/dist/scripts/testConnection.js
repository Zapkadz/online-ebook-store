"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config/config"));
async function testDatabaseConnection() {
    logger_1.logger.info('Testing database connection with configuration:', {
        host: config_1.default.database.host,
        user: config_1.default.database.user,
        database: config_1.default.database.name
    });
    try {
        // Test basic connection
        logger_1.logger.info('Attempting to connect to database...');
        const connection = await database_1.pool.getConnection();
        // Test database version
        const [versionResult] = await connection.query('SELECT VERSION() as version');
        logger_1.logger.info('MySQL Version:', versionResult[0].version);
        // Test database access
        logger_1.logger.info('Testing database access...');
        await connection.query(`USE ${config_1.default.database.name}`);
        logger_1.logger.info('Successfully connected to database:', config_1.default.database.name);
        // Test table access
        logger_1.logger.info('Testing table access...');
        const [tables] = await connection.query('SHOW TABLES');
        logger_1.logger.info('Available tables:', tables);
        // Release connection
        connection.release();
        logger_1.logger.info('Database connection test completed successfully');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection test failed');
        logger_1.logger.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        // Provide more specific error messages
        switch (error.code) {
            case 'ER_ACCESS_DENIED_ERROR':
                logger_1.logger.error('Access denied. Please check your username and password.');
                break;
            case 'ENOTFOUND':
                logger_1.logger.error('Host not found. Please check your DATABASE_HOST setting.');
                break;
            case 'ECONNREFUSED':
                logger_1.logger.error('Connection refused. Please check if MySQL is running.');
                break;
            case 'ER_BAD_DB_ERROR':
                logger_1.logger.error('Database does not exist. Please check your DATABASE_NAME setting.');
                break;
            default:
                logger_1.logger.error('Unknown database error occurred.');
        }
        return false;
    }
}
// Run the test if this script is executed directly
if (require.main === module) {
    testDatabaseConnection()
        .then((success) => {
        if (success) {
            process.exit(0);
        }
        else {
            process.exit(1);
        }
    })
        .catch((error) => {
        logger_1.logger.error('Unexpected error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=testConnection.js.map