'use server';

import { Transaction } from '@/app/types/transaction';
import pool from '@/lib/db/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateEmbedding } from '../ai/embedding';

export async function getBalanceSummary() {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT amount, type FROM transactions',
  );

  const { totalIncome, totalExpense, savings } = (
    (rows as { amount: number | string; type: string }[]) || []
  ).reduce(
    (acc, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') acc.totalIncome += amount;
      else if (tx.type === 'expense') acc.totalExpense += amount;
      acc.savings = acc.totalIncome - acc.totalExpense;
      return acc;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      savings: 0,
    },
  );

  return {
    totalIncome,
    totalExpense,
    savings,
  };
}

export async function getTransactions(params?: {
  limit?: number;
  page?: number;
  search?: string;
}) {
  const { limit = 10, page = 1, search } = params || {};
  const offset = (page - 1) * limit;

  let countSql = 'SELECT COUNT(*) as total FROM transactions';
  let dataSql =
    'SELECT id, amount, type, description, date, category FROM transactions';
  const queryParams: (string | number)[] = [];

  if (search && search.trim() !== '') {
    countSql += ' WHERE description LIKE ?';
    dataSql += ' WHERE description LIKE ?';
    queryParams.push(`%${search.trim()}%`);
  }

  dataSql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';

  const [countRows] = await pool.query<RowDataPacket[]>(countSql, queryParams);
  const totalData = (countRows[0] as { total: number })?.total || 0;

  const [dataRows] = await pool.query<RowDataPacket[]>(dataSql, [
    ...queryParams,
    limit,
    offset,
  ]);

  const data = (dataRows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    type: row.type as 'income' | 'expense',
    category: String(row.category),
    amount: Number(row.amount),
    description: String(row.description ?? ''),
    date:
      row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date),
  }));

  return {
    data,
    totalData,
    totalPages: Math.ceil(totalData / limit),
  };
}

async function handleEmbedding(
  transaction: Omit<Transaction, 'id' | 'user_id' | 'embedding'>,
) {
  const embeddingText = JSON.stringify(transaction);

  let embeddingVector: number[] | null = null;

  try {
    embeddingVector = await generateEmbedding(embeddingText);
  } catch (error) {
    console.warn('Failed to generate embedding (check API key):', error);
  }

  return embeddingVector;
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'user_id' | 'embedding'>,
) {
  const id = crypto.randomUUID();
  const embeddingVector = await handleEmbedding(transaction);

  const formattedDate =
    transaction.date instanceof Date
      ? transaction.date.toISOString().split('T')[0]
      : transaction.date;

  const sql = `
    INSERT INTO transactions (id, type, category, amount, description, date, user_id, embedding)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await pool.query(sql, [
    id,
    transaction.type,
    transaction.category,
    transaction.amount,
    transaction.description || null,
    formattedDate,
    null,
    embeddingVector ? JSON.stringify(embeddingVector) : null,
  ]);

  return { id, ...transaction, embedding: embeddingVector };
}

export async function deleteTransaction(id: string) {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM transactions WHERE id = ?',
    [id],
  );

  return result.affectedRows > 0;
}

export async function updateTransaction(
  id: string,
  transaction: Omit<Transaction, 'id' | 'user_id' | 'embedding'>,
) {
  const embeddingVector = await handleEmbedding(transaction);

  const formattedDate =
    transaction.date instanceof Date
      ? transaction.date.toISOString().split('T')[0]
      : transaction.date;

  const sql = `
    UPDATE transactions
    SET type = ?, category = ?, amount = ?, description = ?, date = ?, embedding = ?
    WHERE id = ?
  `;

  await pool.query(sql, [
    transaction.type,
    transaction.category,
    transaction.amount,
    transaction.description || null,
    formattedDate,
    embeddingVector ? JSON.stringify(embeddingVector) : null,
    id,
  ]);

  return { id, ...transaction, embedding: embeddingVector };
}
