import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, MessageCircle, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { showError } from '../utils/toast';
import { containsContact } from '../utils/detectContact';
import LoadingSpinner from './LoadingSpinner';

interface ProductChatProps {
  productId: string;
  sellerId: string;
  storeName: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  chat_id: string;
  sender?: {
    email: string;
    store_name?: string;
  };
}

const TypingIndicator = () => (
  <div className="flex items-end gap-2 justify-start">
    <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
      <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
    </div>
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1 items-center h-4">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400 font-medium px-2">{date}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  return new Intl.DateTimeFormat('pt-MZ', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
}

function formatDateLabel(dateString: string): string {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'long' }).format(d);
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getInitials(msg: Message): string {
  const name = msg.sender?.store_name || msg.sender?.email || '?';
  return name.charAt(0).toUpperCase();
}

const ProductChat: React.FC<ProductChatProps> = ({ productId, sellerId, storeName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!user || !sellerId) { setChatLoading(false); return; }
    if (user.id === sellerId) { setChatId('VENDEDOR_PROPRIO'); setChatLoading(false); return; }
    setupChat();
  }, [user, productId, sellerId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOtherTyping) scrollToBottom(); }, [isOtherTyping, scrollToBottom]);

  const setupChat = async () => {
    if (!user || !productId || !sellerId) return;
    setChatLoading(true);
    try {
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats').select('id')
        .eq('product_id', productId).eq('client_id', user.id).eq('seller_id', sellerId).single();

      let currentChatId = existingChat?.id;

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar chat:', fetchError);
      }

      if (!currentChatId) {
        const { data: newChat, error: createError } = await supabase
          .from('chats').insert({ product_id: productId, client_id: user.id, seller_id: sellerId })
          .select('id').single();
        if (createError) { showError('Erro ao iniciar conversa'); return; }
        currentChatId = newChat.id;
      }

      setChatId(currentChatId);
      await fetchMessages(currentChatId);
      setupRealtimeSubscription(currentChatId);
      setupTypingChannel(currentChatId);
    } catch {
      showError('Erro ao configurar conversa');
    } finally {
      setChatLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(email, store_name)')
      .eq('chat_id', id).order('created_at', { ascending: true });
    if (!error) setMessages(data || []);
  };

  const setupRealtimeSubscription = (id: string) => {
    supabase.channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` },
        async (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== user?.id) {
            const { data: senderData } = await supabase.from('profiles').select('email, store_name').eq('id', msg.sender_id).single();
            setMessages(prev => [...prev, { ...msg, sender: senderData || { email: 'Desconhecido' } }]);
          }
        })
      .subscribe();
  };

  const setupTypingChannel = (id: string) => {
    const ch = supabase.channel(`typing:${id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.sender_id !== user?.id) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();
    typingChannelRef.current = ch;
  };

  const broadcastTyping = () => {
    if (!typingChannelRef.current || !user) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender_id: user.id } });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId || chatId === 'VENDEDOR_PROPRIO') return;

    const messageContent = newMessage.trim();

    if (containsContact(messageContent)) {
      showError('Por razões de segurança, não é permitido partilhar contactos, links ou redes sociais no chat.');
      return;
    }

    setSending(true);
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      chat_id: chatId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: { email: user.email, store_name: user.profile?.store_name ?? undefined }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({ chat_id: chatId, sender_id: user.id, content: messageContent });
      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        showError('Erro ao enviar mensagem');
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── Render states ──

  if (!user) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Faça login para conversar</h3>
            <p className="text-sm text-gray-500 mt-1">Entre na sua conta para tirar dúvidas com o vendedor</p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full">Fazer Login</Button>
        </CardContent>
      </Card>
    );
  }

  if (user.id === sellerId) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <MessageCircle className="w-10 h-10 text-gray-300" />
          <p className="text-sm text-gray-500">Use o painel de chats para gerir conversas com clientes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 flex flex-col overflow-hidden" style={{ height: 520 }}>
      {/* Header */}
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base leading-tight">Conversa com o vendedor</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">{storeName}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-0 bg-gray-50">
        {chatLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            {/* Messages area */}
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Inicia a conversa!</p>
                  <p className="text-xs text-gray-400">Faz uma pergunta sobre este produto ao vendedor.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const mine = msg.sender_id === user.id;
                  const prevMsg = messages[idx - 1];
                  const showDate = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
                  const showAvatar = !mine && (!messages[idx + 1] || messages[idx + 1].sender_id !== msg.sender_id);

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && <DateSeparator date={formatDateLabel(msg.created_at)} />}
                      <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar only for last message in a sequence from other person */}
                        {!mine && (
                          <div className="w-7 flex-shrink-0 self-end mb-1">
                            {showAvatar && (
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                                  {getInitials(msg)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div className={`px-4 py-2.5 shadow-sm break-words ${
                            mine
                              ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                              : 'bg-white border border-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                          <p className={`text-[10px] px-1 ${mine ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}>
                            {formatRelativeTime(msg.created_at)}
                          </p>
                        </div>

                        {mine && (
                          <div className="w-7 flex-shrink-0" />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {isOtherTyping && <TypingIndicator />}
            </div>

            {/* Security notice */}
            <div className="mx-3 mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-snug">
                Nunca partilhes dados de pagamento ou contactos fora da plataforma. A LojaRápida não pede dados bancários por chat.
              </p>
            </div>

            {/* Contact blocked warning */}
            <div className="mx-3 mb-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-600 leading-snug">
                Mensagens com telefones, emails ou links são automaticamente bloqueadas.
              </p>
            </div>

            {/* Input area */}
            <div className="border-t bg-white px-3 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreve uma mensagem..."
                  disabled={sending || !chatId}
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-colors disabled:opacity-50"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || !chatId}
                  size="icon"
                  className="rounded-full w-10 h-10 flex-shrink-0 transition-transform active:scale-95"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductChat;
