import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Package, Star, Shield, Truck, CreditCard, MessageCircle, Clock, AlertTriangle, Maximize, MapPin, Store, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { showSuccess, showError } from '../utils/toast';
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

const ProductChat: React.FC<ProductChatProps> = ({ productId, sellerId, storeName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !sellerId) {
      setChatLoading(false);
      return;
    }

    if (user.id === sellerId) {
      setChatId('VENDEDOR_PROPRIO');
      setChatLoading(false);
      return;
    }

    setupChat();
  }, [user, productId, sellerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupChat = async () => {
    if (!user || !productId || !sellerId) return;

    setChatLoading(true);
    
    try {
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('product_id', productId)
        .eq('client_id', user.id)
        .eq('seller_id', sellerId)
        .single();

      let currentChatId = existingChat?.id;

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar chat existente:', fetchError);
      }

      if (!currentChatId) {
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            product_id: productId,
            client_id: user.id,
            seller_id: sellerId,
          })
          .select('id')
          .single();
        
        if (createError) {
          showError('Erro ao iniciar conversa');
          return;
        }

        currentChatId = newChat.id;
      }

      setChatId(currentChatId);
      await fetchMessages(currentChatId);
      const subscription = setupRealtimeSubscription(currentChatId);
      
      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };

    } catch (error) {
      showError('Erro ao configurar conversa');
    } finally {
      setChatLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(email, store_name)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error) {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const setupRealtimeSubscription = (chatId: string) => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          if (newMessage.sender_id !== user?.id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('email, store_name')
              .eq('id', newMessage.sender_id)
              .single();
            
            const messageWithSender: Message = {
              ...newMessage,
              sender: senderData || { email: 'Desconhecido' }
            };

            setMessages(prev => [...prev, messageWithSender]);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription em tempo real');
        }
      });

    return channel;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId || chatId === 'VENDEDOR_PROPRIO') return;

    setSending(true);
    const messageContent = newMessage.trim();

    const optimisticMessage: Message = {
      id: Date.now().toString(),
      chat_id: chatId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: {
        email: user.email,
        store_name: user.profile?.store_name
      }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: messageContent,
        });

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        showError('Erro ao enviar mensagem');
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(dateString));
  };

  const isMyMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Converse com o vendedor</CardTitle>
            <p className="text-sm text-gray-600">{storeName}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="font-semibold">Faça login para conversar</h3>
              <Button onClick={() => navigate('/login')} className="w-full">Fazer Login</Button>
            </div>
          </div>
        ) : user.id === sellerId ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-600">
            <p>Você é o vendedor deste produto.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatLoading ? (
                <div className="text-center py-8"><LoadingSpinner /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-600">Inicie a conversa!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMyMessage(msg) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 text-right ${isMyMessage(msg) ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="bg-yellow-50 border-t border-yellow-200 p-3 mx-4 mb-2">
              <div className="flex items-start space-x-2 text-xs text-yellow-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Para sua segurança, nunca compartilhe dados pessoais ou de pagamento fora deste chat.</p>
              </div>
            </div>
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua mensagem..." disabled={sending || !chatId} className="flex-1" />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending || !chatId} size="icon">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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