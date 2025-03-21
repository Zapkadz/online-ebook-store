import mysql, { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import config from './config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandler';

// Log database configuration (for debugging)
logger.info('Database config:', {
  host: config.database.host,
  user: config.database.user,
  database: config.database.name
});

// Create the connection pool
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00', // Set UTC timezone
  dateStrings: true // Return dates as strings
});

// Test database connection
async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    logger.info('Database connection successful');
    
    // Get server version
    const [rows] = await connection.query<RowDataPacket[]>('SELECT VERSION() as version');
    logger.info(`MySQL Server Version: ${rows[0].version}`);
    
    // Test database access
    await connection.query('SELECT 1');
    logger.info('Database access verified');
    
    connection.release();
  } catch (error) {
    logger.error('Error connecting to database:', error);
    throw new AppError(500, 'Database connection failed');
  }
}

// Utility function to execute transactions
async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Interface for where clause conditions
interface WhereCondition {
  [key: string]: any;
}

// Helper function to build WHERE clauses
function buildWhereClause(conditions: WhereCondition): {
  whereClause: string;
  values: any[];
} {
  const clauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        clauses.push(`${key} IN (?)`);
        values.push(value);
      } else if (typeof value === 'object' && value !== null) {
        if ('$like' in value) {
          clauses.push(`${key} LIKE ?`);
          values.push(`%${value.$like}%`);
        } else if ('$gt' in value) {
          clauses.push(`${key} > ?`);
          values.push(value.$gt);
        } else if ('$lt' in value) {
          clauses.push(`${key} < ?`);
          values.push(value.$lt);
        } else if ('$gte' in value) {
          clauses.push(`${key} >= ?`);
          values.push(value.$gte);
        } else if ('$lte' in value) {
          clauses.push(`${key} <= ?`);
          values.push(value.$lte);
        }
      } else {
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

// Helper function for pagination
interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

function buildPaginationClause(options: PaginationOptions = {}): {
  paginationClause: string;
  values: number[];
} {
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
async function tableExists(tableName: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [config.database.name, tableName]
  );
  return rows.length > 0;
}

export {
  pool,
  testConnection,
  withTransaction,
  buildWhereClause,
  buildPaginationClause,
  tableExists,
  type WhereCondition,
  type PaginationOptions
};