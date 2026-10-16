import { Metadata } from 'next';
import DashboardContent from './_components/dashboard-content';

export const metadata: Metadata = {
  title: 'Fina - Dasbor Keuangan',
  description: 'Dasbor keuangan pribadi cerdas bertenaga AI',
};

export default function DashboardPage() {
  return (
    <div className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-4xl font-bold text-primary">Dasbor</h1>
        <p className="text-muted-foreground">
          Pantau arus kas, lacak pengeluaran, dan kelola keuangan pribadi Anda
          secara cerdas.
        </p>
      </section>
      <DashboardContent />
    </div>
  );
}
