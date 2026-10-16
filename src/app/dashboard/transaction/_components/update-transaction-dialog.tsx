import { Transaction } from '@/app/types/transaction';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, CATEGORY_LABELS } from '@/constants/transaction-constant';
import { updateTransaction } from '@/features/transaction/action';
import { formatThousands, parseThousands } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  amount: z.string().min(1, 'Nominal transaksi wajib diisi'),
  type: z.enum(['income', 'expense'], {
    error: 'Jenis transaksi wajib dipilih',
  }),
  category: z.string().min(1, 'Kategori transaksi wajib dipilih'),
  date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  description: z.string().min(1, 'Deskripsi transaksi wajib diisi'),
});

export default function UpdateTransactionDialog({
  selectedTransaction,
  setSelectedTransaction,
  refetch,
}: {
  selectedTransaction: {
    data: Omit<Transaction, 'user_id' | 'embedding'>;
    action: 'update' | 'delete';
  } | null;
  setSelectedTransaction: Dispatch<
    SetStateAction<{
      data: Omit<Transaction, 'user_id' | 'embedding'>;
      action: 'update' | 'delete';
    } | null>
  >;
  refetch: () => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: selectedTransaction
        ? formatThousands(selectedTransaction.data.amount)
        : '',
      type: selectedTransaction ? selectedTransaction.data.type : 'income',
      category: selectedTransaction ? selectedTransaction.data.category : '',
      date: selectedTransaction ? String(selectedTransaction.data.date) : '',
      description: selectedTransaction
        ? selectedTransaction.data.description
        : '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: z.infer<typeof formSchema>;
    }) => {
      const formatedData = {
        ...data,
        amount: parseThousands(data.amount),
      };
      return updateTransaction(id, formatedData);
    },
    onSuccess: () => {
      setSelectedTransaction(null);
      refetch();
      form.reset();
      toast.success('Transaksi berhasil diperbarui!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Gagal memperbarui transaksi',
      );
    },
  });

  useEffect(() => {
    if (selectedTransaction) {
      form.reset({
        amount: formatThousands(selectedTransaction.data.amount),
        type: selectedTransaction.data.type,
        category: selectedTransaction.data.category,
        date: String(selectedTransaction.data.date),
        description: selectedTransaction.data.description,
      });
    }
  }, [selectedTransaction]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutate({
      id: String(selectedTransaction?.data.id),
      data,
    });
  };

  return (
    <Dialog
      open={!!selectedTransaction && selectedTransaction.action === 'update'}
      onOpenChange={() => setSelectedTransaction(null)}
    >
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader className="gap-4">
            <div>
              <DialogTitle>Ubah Transaksi</DialogTitle>
              <DialogDescription>
                Perbarui data rincian transaksi di bawah ini.
              </DialogDescription>
            </div>
            <FieldGroup className="gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="form-amount">Nominal (Rp)</FieldLabel>
                    <Input
                      id="form-amount"
                      placeholder="Contoh: 100.000"
                      autoComplete="off"
                      type="text"
                      inputMode="numeric"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(formatThousands(e.target.value));
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="form-type">Jenis Transaksi</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="form-type">
                        <SelectValue placeholder="Pilih jenis transaksi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">
                          Pemasukan (Income)
                        </SelectItem>
                        <SelectItem value="expense">
                          Pengeluaran (Expense)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="form-category">Kategori</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="form-category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem value={category} key={category}>
                            {CATEGORY_LABELS[category] || category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="date"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="form-date">Tanggal</FieldLabel>
                    <DatePicker
                      id="form-date"
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="form-description">
                      Keterangan / Deskripsi
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="form-description"
                      placeholder="Masukkan deskripsi transaksi"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedTransaction(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={!form.formState.isValid || isPending}
            >
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
