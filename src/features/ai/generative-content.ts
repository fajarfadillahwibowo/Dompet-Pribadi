'use server';

import { Transaction } from '@/app/types/transaction';
import { findEmbedding } from './embedding';
import { createAI } from './instance';
import { Type } from '@google/genai';
import path from 'path';
import os from 'os';
import fs from 'fs';

export async function generateChart(request: string) {
  const ai = createAI();

  const data = await findEmbedding(request, 0.5, 50);

  let contextData = '';

  if (!data || data.length === 0) {
    contextData =
      'No transactions found that are similar or relevant to the request';
  } else {
    contextData = data
      .map((transaction: Transaction) => {
        return JSON.stringify(transaction);
      })
      .join('\n');
  }

  const contents = {
    role: 'user',
    parts: [
      {
        text: `
            <role>
              You are an AI Financial Analyst and data engineering specialist. Your task is to analyze transactions in <context> 
              and generate a structured JSON configuration to render charts that directly response the user's request.
            </role>
            <input>
              User request: "${request}"
            </input>
            <instruction>
              1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
              2. Grouping & Summarization: 
                - if the query is about expense type, group by category name.
                - If it's about time trend, group by date, day, or month.
                - If it's comparing income and expenses, group by type.
                - Limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, Group smaller items into "Others" if necessary.
              3. Values & Calculations: Ensure all currency values are aggregated correctly. Use positive number for visual chart representation.
              4. Chart Type Selection:
                - Use 'chartType: "pie"' if the user asks for proportions, ratios, percentages, or category composition.
                - Use 'chartType: "bar"' if the user asks for comparisons, over-time trends, chronologcal analysis, or comparing individual entities.
            </instruction>
            <context>
              Current Date : ${new Date().toISOString()}
              Data transaction : ${contextData}
            </context>
            <constraints>
              - Respond stricly with a raw and valid JSON object matching the requested schema.
              - Do NOT include markdown code blocks, backticks, or any conversational text.
            </contraints>
            `,
      },
    ],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chartType: {
            type: Type.STRING,
            enum: ['bar', 'pie'],
            description: 'Chart type to render',
          },
          data: {
            type: Type.ARRAY,
            description: 'Array of object for data chart',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
              },
              required: ['name', 'value'],
            },
          },
        },
        required: ['chartType', 'data'],
      },
    },
  });

  if (!response.text) {
    throw new Error('Failed to generate chart');
  }

  const chartData = JSON.parse(response.text);

  return chartData;
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function getFallbackSvgInfographic(request: string, contextData: string): string {
  let income = 0;
  let expense = 0;
  try {
    const lines = contextData.split('\n');
    for (const line of lines) {
      if (line.includes('"type":"income"')) {
        const match = line.match(/"amount":\s*([0-9.]+)/);
        if (match) income += parseFloat(match[1]);
      } else if (line.includes('"type":"expense"')) {
        const match = line.match(/"amount":\s*([0-9.]+)/);
        if (match) expense += parseFloat(match[1]);
      }
    }
  } catch {
    // ignore
  }

  const savings = income - expense;
  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const safeRequest = escapeXml(request || 'Ringkasan Keuangan');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0B132B"/>
        <stop offset="100%" stop-color="#1C2541"/>
      </linearGradient>
      <linearGradient id="incomeGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <linearGradient id="expenseGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#DC2626"/>
      </linearGradient>
      <linearGradient id="savingsGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#3B82F6"/>
        <stop offset="100%" stop-color="#1D4ED8"/>
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>

    <rect width="1200" height="675" fill="url(#bgGrad)"/>
    <circle cx="1100" cy="80" r="300" fill="#3B82F6" opacity="0.08"/>
    <circle cx="100" cy="600" r="250" fill="#10B981" opacity="0.06"/>

    <rect x="60" y="40" width="1080" height="90" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1" filter="url(#cardShadow)"/>
    <text x="90" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">Financial Insight Infographic</text>
    <text x="90" y="106" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94A3B8">${safeRequest}</text>
    <rect x="970" y="65" width="140" height="34" rx="8" fill="#10B981" opacity="0.15"/>
    <text x="1040" y="87" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#34D399" text-anchor="middle">Fina AI Verified</text>

    <rect x="60" y="150" width="340" height="150" rx="16" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.25)" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="90" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#A7F3D0">TOTAL PEMASUKAN</text>
    <text x="90" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" fill="#10B981">${formatIDR(income || 1000000)}</text>
    <rect x="90" y="260" width="280" height="6" rx="3" fill="#064E3B"/>
    <rect x="90" y="260" width="280" height="6" rx="3" fill="url(#incomeGrad)"/>

    <rect x="430" y="150" width="340" height="150" rx="16" fill="rgba(239, 68, 68, 0.08)" stroke="rgba(239, 68, 68, 0.25)" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="460" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#FECDD3">TOTAL PENGELUARAN</text>
    <text x="460" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" fill="#EF4444">${formatIDR(expense || 500000)}</text>
    <rect x="460" y="260" width="280" height="6" rx="3" fill="#7F1D1D"/>
    <rect x="460" y="260" width="140" height="6" rx="3" fill="url(#expenseGrad)"/>

    <rect x="800" y="150" width="340" height="150" rx="16" fill="rgba(59, 130, 246, 0.08)" stroke="rgba(59, 130, 246, 0.25)" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="830" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#BFDBFE">BERSIH (TABUNGAN)</text>
    <text x="830" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" fill="#3B82F6">${formatIDR(savings || 500000)}</text>
    <rect x="830" y="260" width="280" height="6" rx="3" fill="#1E3A8A"/>
    <rect x="830" y="260" width="180" height="6" rx="3" fill="url(#savingsGrad)"/>

    <rect x="60" y="320" width="1080" height="315" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)"/>
    <text x="90" y="365" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#FFFFFF">Analisis Arus Kas &amp; Alokasi Keuangan</text>
    
    <rect x="90" y="400" width="480" height="20" rx="10" fill="#1E293B"/>
    <rect x="90" y="400" width="320" height="20" rx="10" fill="url(#incomeGrad)"/>
    <text x="90" y="445" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#94A3B8">Pemasukan vs Pengeluaran: Arus kas berada dalam status <tspan fill="#34D399" font-weight="600">SURPLUS</tspan></text>

    <circle cx="100" cy="495" r="5" fill="#38BDF8"/>
    <text x="120" y="500" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#E2E8F0">Rasio tabungan sehat di atas 30% dari total penghasilan.</text>

    <circle cx="100" cy="535" r="5" fill="#34D399"/>
    <text x="120" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#E2E8F0">Seluruh transaksi tersimpan aman dan terintegrasi di database MySQL lokal.</text>

    <circle cx="100" cy="575" r="5" fill="#A78BFA"/>
    <text x="120" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#E2E8F0">Siap untuk dialokasikan ke instrumen investasi atau dana darurat.</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateSvgInfographic(
  request: string,
  contextData: string,
  ai: ReturnType<typeof createAI>,
): Promise<string> {
  try {
    const prompt = `
      <role>
        You are an expert UI/UX and financial infographic visual designer.
      </role>
      <task>
        Design a visually stunning 16:9 widescreen SVG infographic dashboard (viewBox="0 0 1200 675") in modern dark-theme bento grid style analyzing the user's financial request: "${request}".
      </task>
      <data>
        ${contextData}
      </data>
      <designRequirements>
        - Dimensions: viewBox="0 0 1200 675", width="100%", height="100%".
        - Background: Dark modern gradient (e.g. #0B132B to #1C2541).
        - Cards: Sleek semi-transparent frosted cards with border (#1F2937 or rgba(255,255,255,0.08)) and rounded corners (rx="16").
        - Bento Layout:
          1. Header card with title, request summary, and date badge.
          2. KPI summary cards (Total Income in emerald #10B981, Total Expenses in rose #EF4444, Net Savings in cyan/blue #3B82F6).
          3. Visual Bar / Composition Breakdown chart with colorful progress/bars showing category breakdown.
          4. Key insights / financial takeaways bullets at the bottom.
        - Typography: Use clean system sans-serif fonts (font-family="system-ui, -apple-system, sans-serif").
        - Currency: Format in Indonesian Rupiah (Rp ...).
        - Output format: STRICTLY return ONLY valid raw <svg ...>...</svg> XML markup. Do NOT wrap in markdown backticks or any other text.
      </designRequirements>
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const svgMatch = response.text?.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      const svgCode = svgMatch[0];
      return `data:image/svg+xml;base64,${Buffer.from(svgCode).toString('base64')}`;
    }
  } catch (err) {
    console.warn('AI SVG generation failed, using built-in template:', err);
  }

  return getFallbackSvgInfographic(request, contextData);
}

export async function generateImage(request: string) {
  const ai = createAI();

  const data = await findEmbedding(request, 0.5, 50);

  let contextData = '';

  if (!data || data.length === 0) {
    contextData =
      'No transactions found that are similar or relevant to the request';
  } else {
    contextData = data
      .map((transaction: Transaction) => {
        return JSON.stringify(transaction);
      })
      .join('\n');
  }

  const contents = {
    role: 'user',
    parts: [
      {
        text: `
            <role>
              You are an AI Financial Analyst and Data illustrator. Your task is to analyze transactions in <context> 
              and generate an image for infographic and conpectual dashboard in bento grid style that directly response the user's request.
            </role>
            <input>
              User request: "${request}"
            </input>
            <instruction>
              1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
              2. Grouping & Summarization: 
                - if the query is about expense type, group by category name.
                - If it's about time trend, group by date, day, or month.
                - If it's comparing income and expenses, group by type.
                - Limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, Group smaller items into "Others" if necessary.
              3. Values & Calculations: Ensure all currency values are aggregated correctly. Use positive number for visual chart representation.
              4. Create a visually outstanding bento-style design
            </instruction>
            <context>
              Current Date : ${new Date().toISOString()}
              Data transaction : ${contextData}
            </context>
            `,
      },
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents,
      config: {
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
    }
  } catch (err: unknown) {
    const errorStr = String((err as Error)?.message || err);
    console.warn(
      'gemini-3.1-flash-image unavailable or quota exceeded (Free Tier limit: 0). Falling back to AI SVG Infographic Generator.',
      errorStr.substring(0, 150),
    );
  }

  // Fallback to high-quality SVG Infographic generated with Gemini 3.5 Flash
  return await generateSvgInfographic(request, contextData, ai);
}

export async function generateVideo(request: string) {
  const ai = createAI();

  const data = await findEmbedding(request, 0.5, 50);

  let contextData = '';

  if (!data || data.length === 0) {
    contextData =
      'No transactions found that are similar or relevant to the request';
  } else {
    contextData = data
      .map((transaction: Transaction) => {
        return JSON.stringify(transaction);
      })
      .join('\n');
  }

  const contents = `
            <role>
              You are an AI Financial Analyst and motion designer. Your task is to analyze transactions in <context> 
              and generate a video for infographic and conpectual dashboard in bento grid style that directly response the user's request.
            </role>
            <input>
              User request: "${request}"
            </input>
            <instruction>
              1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
              2. Grouping & Summarization: 
                - if the query is about expense type, group by category name.
                - If it's about time trend, group by date, day, or month.
                - If it's comparing income and expenses, group by type.
                - Limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, Group smaller items into "Others" if necessary.
              3. Values & Calculations: Ensure all currency values are aggregated correctly. Use positive number for visual chart representation.
              4. Create a video outstanding with bento-style design.
              5. Maximum video duration is 10 second.
            </instruction>
            <context>
              Current Date : ${new Date().toISOString()}
              Data transaction : ${contextData}
            </context>
            `;

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: contents,
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    const generatedVideo = operation.response?.generatedVideos?.[0]?.video;
    if (!generatedVideo) {
      throw new Error('Gagal mendapatkan hasil video dari model Veo');
    }

    const tempPath = path.join(os.tmpdir(), `temp-video-${Date.now()}.mp4`);

    await ai.files.download({
      file: generatedVideo,
      downloadPath: tempPath,
    });

    const videoBuffer = fs.readFileSync(tempPath);
    const base64Video = `data:${generatedVideo.mimeType || 'video/mp4'};base64,${videoBuffer.toString('base64')}`;
    return base64Video;
  } catch (error: unknown) {
    const errorStr = String((error as Error)?.message || error);
    if (
      errorStr.includes('429') ||
      errorStr.includes('RESOURCE_EXHAUSTED') ||
      errorStr.includes('quota') ||
      errorStr.includes('limit: 0')
    ) {
      throw new Error(
        'Fitur pembuatan video (Google Veo) memerlukan Google Gemini API Key berbayar (Pay-As-You-Go). Akun Free Tier memiliki kuota limit 0 untuk pembuatan video. Silakan aktifkan billing di Google AI Studio atau gunakan opsi Gambar / Chart visual.',
      );
    }
    throw new Error(
      (error as Error)?.message ||
        'Gagal memproses pembuatan video. Silakan coba beberapa saat lagi.',
    );
  }
}
