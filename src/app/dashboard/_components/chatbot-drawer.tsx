'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { handleChatStreaming } from '@/features/ai/chat';
import { cn } from '@/lib/utils';
import { BotIcon, ChevronDownIcon, EllipsisIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatbotTextarea from './chatbot-textarea';
import { useMutation } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Conversation } from '@/app/types/ai';

export default function ChatbotDrawer() {
  const chatRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [mode, setMode] = useState<'general' | 'personal'>('general');

  const { mutate: handleChatMutation, isPending } = useMutation({
    mutationFn: async ({ isThinking }: { isThinking: boolean }) => {
      if (isThinking) {
        setConversation((prev) => [
          ...prev,
          { role: 'model', parts: [{ thought: true, text: '' }, { text: '' }] },
        ]);
        const response = await handleChatStreaming(
          conversation,
          isThinking,
          mode,
        );
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;

            const parts = newConversation[lastIndex].parts;

            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                {
                  ...parts[0],
                  text: chunk.startsWith('[thought]')
                    ? parts[0].text + chunk.replace('[thought]', '')
                    : parts[0].text,
                },
                {
                  text: !chunk.startsWith('[thought]')
                    ? parts[1].text + chunk
                    : parts[1].text,
                },
              ],
            };
            return newConversation;
          });
        }
        return response;
      } else {
        setConversation((prev) => [
          ...prev,
          { role: 'model', parts: [{ text: '' }] },
        ]);
        const response = await handleChatStreaming(
          conversation,
          isThinking,
          mode,
        );
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;

            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                { text: newConversation[lastIndex].parts[0].text + chunk },
              ],
            };
            return newConversation;
          });
        }
        return response;
      }
    },
    onError: (error) => {
      const botMessage = {
        role: 'model',
        parts: [{ text: 'Terjadi kesalahan: ' + error.message }],
      };
      setConversation((prev) => [...prev, botMessage]);
    },
  });

  function sendMessage(message: string) {
    const newMessage = {
      role: 'user',
      parts: [{ text: message }],
    };
    setConversation((prev) => [...prev, newMessage]);
    handleChatMutation({ isThinking });
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation]);

  return (
    <Drawer direction="right" modal={false}>
      <DrawerTrigger className="fixed bottom-4 right-4" asChild>
        <Button
          className="rounded-full size-14 shadow-lg"
          size="icon-lg"
          variant="outline"
          title="Buka Chatbot Finabot"
        >
          <BotIcon className="size-6 text-primary" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-screen! md:w-110!">
        <DrawerHeader className="flex flex-row justify-between items-center">
          <div>
            <DrawerTitle className="font-bold text-primary flex items-center gap-2">
              <BotIcon className="size-5" />
              Finabot - AI Financial Advisor
            </DrawerTitle>
            <DrawerDescription>
              Konsultasikan perencanaan &amp; analisis keuangan Anda secara cerdas.
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="outline" size="icon">
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="h-full px-4 overflow-y-auto no-scrollbar">
          {conversation.length > 0 ? (
            <div
              ref={chatRef}
              className="flex flex-col h-full overflow-x-hidden overflow-y-auto gap-8 no-scrollbar"
            >
              {conversation.map((message, index) => (
                <div
                  key={`conversation-${index}`}
                  className={cn(
                    'flex flex-col gap-2',
                    message.role === 'model' ? 'items-start' : 'items-end',
                  )}
                >
                  <div
                    className={cn('flex flex-col w-full', {
                      'bg-primary/20 text-primary px-5 py-2 rounded-3xl rounded-br-md w-fit max-w-3/4':
                        message.role === 'user',
                    })}
                  >
                    {message.role === 'model' && (
                      <div className="flex items-center text-xs font-semibold gap-1 text-primary mb-1">
                        <BotIcon className="size-3" />
                        Finabot AI
                      </div>
                    )}
                    {message.role === 'model' ? (
                      <div className="response-ai">
                        {message.parts.map((part, indexPart) => (
                          <div key={`response-ai-${index}-${indexPart}`}>
                            {part.thought ? (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-xs">
                                    Lihat proses penalaran
                                    <ChevronDownIcon className="size-3 ml-1" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="pl-3 ml-2 my-2 border-l-2 border-primary/30 text-xs text-muted-foreground">
                                    <Markdown>{part.text}</Markdown>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <Markdown>{part.text}</Markdown>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      message.parts[0].text
                    )}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex items-center -mt-8 animate-pulse">
                  <EllipsisIcon className="size-8 text-primary/50" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <BotIcon className="size-12 text-primary mb-3" />
              <h2 className="text-2xl font-bold text-primary">Halo! Saya Finabot</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ada yang bisa saya bantu seputar perencanaan, anggaran, atau transaksi keuangan Anda?
              </p>
            </div>
          )}
        </div>
        <DrawerFooter>
          <ChatbotTextarea
            isThinking={isThinking}
            setIsThinking={setIsThinking}
            sendMessage={sendMessage}
            mode={mode}
            setMode={setMode}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
