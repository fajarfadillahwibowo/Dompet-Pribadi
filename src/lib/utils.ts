import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

// Memformat angka dengan pemisah ribuan titik (contoh: 100000 -> 100.000)
export function formatThousands(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '';
  const clean = String(value).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
}

// Mengambil angka murni dari string berformat titik (contoh: "100.000" -> 100000)
export function parseThousands(
  value: string | number | null | undefined,
): number {
  if (!value) return 0;
  const clean = String(value).replace(/\D/g, '');
  return clean ? Number(clean) : 0;
}
