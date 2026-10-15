'use server';

import pool from '@/lib/db/mysql';
import { RowDataPacket } from 'mysql2';
import { createAI } from './instance';

export async function generateEmbedding(contents: string) {
  const ai = createAI();

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents,
      config: {
        outputDimensionality: 768,
      },
    });

    if (
      !response.embeddings ||
      response.embeddings.length === 0 ||
      !response.embeddings[0].values
    ) {
      throw new Error('Failed to generate embedding');
    }

    return response.embeddings[0].values;
  } catch (error) {
    throw error;
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findEmbedding(
  query: string,
  match_threshold?: number,
  match_count?: number,
) {
  const queryEmbedding = await generateEmbedding(query);
  const threshold = match_threshold ?? 0.3;
  const count = match_count ?? 15;

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, type, category, amount, description, date, user_id, embedding FROM transactions WHERE embedding IS NOT NULL',
  );

  const matched = (rows as Record<string, unknown>[])
    .map((row) => {
      let embeddingVec: number[] | null = null;
      if (typeof row.embedding === 'string') {
        try {
          embeddingVec = JSON.parse(row.embedding);
        } catch {
          embeddingVec = null;
        }
      } else if (Array.isArray(row.embedding)) {
        embeddingVec = row.embedding as number[];
      }

      if (!embeddingVec || embeddingVec.length === 0) return null;

      const similarity = cosineSimilarity(queryEmbedding, embeddingVec);

      return {
        id: String(row.id),
        type: row.type as 'income' | 'expense',
        category: String(row.category),
        amount: Number(row.amount),
        description: String(row.description ?? ''),
        date:
          row.date instanceof Date
            ? row.date.toISOString().split('T')[0]
            : String(row.date),
        user_id: row.user_id ? String(row.user_id) : null,
        embedding: embeddingVec,
        similarity,
      };
    })
    .filter(
      (item): item is NonNullable<typeof item> =>
        item !== null && item.similarity > threshold,
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);

  return matched;
}
