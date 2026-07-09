import { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { useAppStore } from '../../../store';
import { useUser } from '@clerk/react';
import { Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useSyncContext } from '../../../hooks/useSyncEngine';

export const ProjectChat = () => {
  const { user } = useUser();
  const db = useDatabase();
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const { supabaseClient } = useSyncContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    if (!db || !currentBoardId) return;

    const sub = db.chatMessages
      .find({
        selector: { boardId: currentBoardId },
        sort: [{ timestamp: 'asc' }]
      })
      .$.subscribe((msgs: any) => {
        setMessages(msgs);
      });

    return () => sub.unsubscribe();
  }, [db, currentBoardId]);

  // Set up Supabase Broadcast for instant, zero-latency chat
  useEffect(() => {
    if (!supabaseClient || !currentBoardId || !db) return;

    const channel = supabaseClient.channel(`chat:board:${currentBoardId}`);
    
    channel
      .on('broadcast', { event: 'new-message' }, async ({ payload }) => {
        try {
          // Temporarily disable remote sync interceptor to prevent echo
          (window as any).__isRemoteSync = true;
          const doc = await db.chatMessages.findOne({ selector: { id: payload.id } }).exec();
          if (!doc) {
             await db.chatMessages.insert(payload);
          }
        } catch (err) {
          console.warn('Broadcast message insert ignored:', err);
        } finally {
          (window as any).__isRemoteSync = false;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabaseClient.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabaseClient, currentBoardId, db]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !db || !currentBoardId || !user) return;

    const newMsg = {
      id: uuidv4(),
      boardId: currentBoardId,
      text: inputText.trim(),
      authorId: user.id,
      authorName: user.fullName || user.firstName || 'Unknown',
      authorAvatar: user.imageUrl || '',
      timestamp: new Date().toISOString(),
      deviceId: 'local'
    };

    try {
      // 1. Insert locally for persistence (triggers standard sync operations)
      await db.chatMessages.insert(newMsg);
      
      // 2. Broadcast instantly for zero-latency delivery to peers
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new-message',
          payload: newMsg
        });
      }
      
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentBoardId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50">
            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation with your team!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.authorId === user?.id;
            const showHeader = idx === 0 || messages[idx - 1].authorId !== msg.authorId || (new Date(msg.timestamp).getTime() - new Date(messages[idx - 1].timestamp).getTime() > 5 * 60000);
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showHeader && !isMe && (
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    {msg.authorAvatar ? (
                      <img src={msg.authorAvatar} alt={msg.authorName} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                        {msg.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-text-secondary">{msg.authorName}</span>
                  </div>
                )}
                <div 
                  className={`group relative max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-accent text-white rounded-br-sm shadow-sm' 
                      : 'bg-surface border border-border text-text-primary rounded-bl-sm shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                  <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-text-secondary'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 sm:p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 relative">
        <form 
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-end gap-2 bg-surface border border-border rounded-2xl p-1 shadow-sm focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all"
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none hide-scrollbar"
            rows={1}
            style={{
              height: 'auto',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="shrink-0 w-10 h-10 mb-0.5 mr-0.5 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
