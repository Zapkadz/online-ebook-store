import { pool, testConnection } from '../config/database';
import { logger } from '../utils/logger';
import config from '../config/config';

async function testDatabaseConnection() {
  logger.info('Testing database connection with configuration:', {
    host: config.database.host,
    user: config.database.user,
    database: config.database.name
  });

  try {
    // Test basic connection
    logger.info('Attempting to connect to database...');
    const connection = await pool.getConnection();
    
    // Test database version
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    logger.info('MySQL Version:', (versionResult as any)[0].version);

    // Test database access
    logger.info('Testing database access...');
    await connection.query(`USE ${config.database.name}`);
    logger.info('Successfully connected to database:', config.database.name);

    // Test table access
    logger.info('Testing table access...');
    const [tables] = await connection.query('SHOW TABLES');
    logger.info('Available tables:', tables);

    // Release connection
    connection.release();
    logger.info('Database connection test completed successfully');

    return true;
  } catch (error: any) {
    logger.error('Database connection test failed');
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });

    // Provide more specific error messages
    switch (error.code) {
      case 'ER_ACCESS_DENIED_ERROR':
        logger.error('Access denied. Please check your username and password.');
        break;
      case 'ENOTFOUND':
        logger.error('Host not found. Please check your DATABASE_HOST setting.');
        break;
      case 'ECONNREFUSED':
        logger.error('Connection refused. Please check if MySQL is running.');
        break;
      case 'ER_BAD_DB_ERROR':
        logger.error('Database does not exist. Please check your DATABASE_NAME setting.');
        break;
      default:
        logger.error('Unknown database error occurred.');
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
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection };