import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { convertToIDR } from '@/lib/utils';
import { TrendingDownIcon, TrendingUpIcon, WalletIcon } from 'lucide-react';

export function BalanceCards({
  data,
  error,
}: {
  data:
    | { savings: number; totalIncome: number; totalExpense: number }
    | undefined;
  error: unknown;
}) {
  if (error) {
    return (
      <div className="w-full p-4 text-sm border rounded-lg border-destructive/50 text-destructive bg-destructive/10">
        Gagal memuat data ringkasan saldo
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <WalletIcon className="size-4" />
            Tabungan / Sisa Saldo
          </CardTitle>
          <CardDescription className="text-lg font-semibold lg:text-2xl text-secondary-foreground">
            {convertToIDR(Number(data?.savings || 0))}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          Total sisa saldo sepanjang waktu
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUpIcon className="size-4" />
            Total Pemasukan
          </CardTitle>
          <CardDescription className="text-lg font-semibold lg:text-2xl text-secondary-foreground">
            {convertToIDR(Number(data?.totalIncome || 0))}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          Akumulasi seluruh pemasukan
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingDownIcon className="size-4" />
            Total Pengeluaran
          </CardTitle>
          <CardDescription className="text-lg font-semibold lg:text-2xl text-secondary-foreground">
            {convertToIDR(Number(data?.totalExpense || 0))}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          Akumulasi seluruh pengeluaran
        </CardFooter>
      </Card>
    </div>
  );
}
