import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrainIcon, SendIcon } from 'lucide-react';
import { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});

export default function ChatbotTextarea({
  sendMessage,
  isThinking,
  setIsThinking,
  mode,
  setMode,
}: {
  sendMessage: (message: string) => void;
  isThinking: boolean;
  setIsThinking: Dispatch<SetStateAction<boolean>>;
  mode: 'general' | 'personal';
  setMode: Dispatch<SetStateAction<'general' | 'personal'>>;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage(data.message);
    form.reset();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(form.getValues());
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col p-2 bg-secondary rounded-2xl"
    >
      <Controller
        control={form.control}
        name="message"
        render={({ field }) => (
          <Field>
            <textarea
              {...field}
              id="form-message"
              placeholder="Tanyakan hal seputar keuangan atau analisis transaksi Anda di sini..."
              autoComplete="off"
              className="h-16 px-3 py-2 resize-none rounded-md focus:outline-none text-sm"
              onKeyDown={handleKeyDown}
            />
          </Field>
        )}
      />
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <Toggle
            size="sm"
            variant="outline"
            pressed={isThinking}
            onPressedChange={setIsThinking}
            title={isThinking ? 'Mode Penalaran AI Aktif' : 'Aktifkan Mode Penalaran AI (Thinking)'}
            className={cn('text-xs px-0 py-0 h-8 w-8', {
              'bg-primary/20! text-primary': isThinking,
            })}
          >
            <BrainIcon className="size-4" />
          </Toggle>
          <Select
            value={mode}
            onValueChange={(value: 'general' | 'personal') => setMode(value)}
          >
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue>
                {mode === 'general' ? 'Konsultasi Umum' : 'Analisis Pribadi'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Konsultasi Umum</SelectItem>
              <SelectItem value="personal">Analisis Keuangan Pribadi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            title="Kirim pesan"
            className="cursor-pointer text-primary hover:bg-primary/10 hover:text-primary disabled:bg-transparent"
          >
            <SendIcon className="size-5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
