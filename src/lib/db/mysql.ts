import mysql from 'mysql2/promise';
import { ENVIRONMENT } from '@/config/environment';

// Cache connection pool in development to avoid exhausting connections on hot-reload
const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: ENVIRONMENT.dbHost,
    port: ENVIRONMENT.dbPort,
    user: ENVIRONMENT.dbUser,
    password: ENVIRONMENT.dbPassword,
    database: ENVIRONMENT.dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export default pool;
