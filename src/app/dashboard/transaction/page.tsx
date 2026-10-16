import { Metadata } from 'next';
import Transaction from './_components/transaction';

export const metadata: Metadata = {
  title: 'Fina - Transaksi Keuangan',
  description: 'Lihat dan kelola seluruh transaksi keuangan Anda.',
};

export default function TransactionPage() {
  return (
    <div className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-4xl font-bold text-primary">Transaksi</h1>
        <p className="text-muted-foreground">
          Lihat dan kelola seluruh transaksi keuangan Anda.
        </p>
      </section>
      <section id="content">
        <Transaction />
      </section>
    </div>
  );
}
