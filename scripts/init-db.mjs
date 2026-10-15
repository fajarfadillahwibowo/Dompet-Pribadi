import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Manual simple env parser for standalone script
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = values.join('=').trim();
          }
        }
      });
    }
  }
}

loadEnv();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD ?? '';
const dbName = process.env.DB_NAME || 'fina_app';

async function main() {
  console.log(`Connecting to MySQL at ${dbHost}:${dbPort} as user "${dbUser}"...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });
  } catch (error) {
    console.error('❌ Gagal terhubung ke MySQL server:', error.message);
    console.error('Pastikan MySQL di Laragon/XAMPP sudah dinyalakan (Running).');
    process.exit(1);
  }

  try {
    console.log(`Creating database "${dbName}" if not exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );

    await connection.changeUser({ database: dbName });

    console.log('Creating table "transactions" if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`transactions\` (
        \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
        \`type\` ENUM('income', 'expense') NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`amount\` DECIMAL(15, 2) NOT NULL,
        \`description\` TEXT NULL,
        \`date\` DATE NOT NULL,
        \`user_id\` VARCHAR(36) NULL,
        \`embedding\` JSON NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_transactions_date\` (\`date\`),
        INDEX \`idx_transactions_type\` (\`type\`),
        INDEX \`idx_transactions_category\` (\`category\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Inisialisasi database MySQL berhasil! Tabel "transactions" siap digunakan.');
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat inisialisasi tabel:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
