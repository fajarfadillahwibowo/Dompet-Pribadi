import { Button } from '@/components/ui/button';
import { CoinsIcon } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fina - Dompet Pribadi Cerdas Berbasis AI',
  description: 'Kelola keuangan pribadi Anda secara cerdas dengan bantuan AI',
};

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <CoinsIcon className="text-primary size-20 mb-2" />
      <h1 className="text-4xl font-bold text-primary">Selamat Datang di Fina</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Aplikasi pengelolaan keuangan pribadi cerdas bertenaga AI
      </p>
      <Link href="/dashboard">
        <Button className="mt-4" size="lg">
          Mulai Sekarang
        </Button>
      </Link>
    </main>
  );
}
