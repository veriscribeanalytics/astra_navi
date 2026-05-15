'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { clientFetch } from '@/lib/apiClient';
import { useChat, ChatSummary, ChatMessage } from '@/context/ChatContext';
import { 
    MoreVertical, Trash2, Download, 
    AlertTriangle, X, MessageSquare, Plus, Lock, Search
} from 'lucide-react';
import { formatChatTimestamp } from '@/lib/datetime';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/hooks';

function formatChatDate(dateStr: string, t: (key: string) => string): string {
  return formatChatTimestamp(dateStr, t('dashboard.yesterday') || undefined);
}

function groupChatsByDate(chats: ChatSummary[]): { label: string; chats: ChatSummary[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; chats: ChatSummary[] }[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 Days', chats: [] },
    { label: 'Older', chats: [] },
  ];

  for (const chat of chats) {
    const date = new Date(chat.updatedAt || chat.createdAt);
    if (date >= today) groups[0].chats.push(chat);
    else if (date >= yesterday) groups[1].chats.push(chat);
    else if (date >= weekAgo) groups[2].chats.push(chat);
    else groups[3].chats.push(chat);
  }

  return groups.filter(g => g.chats.length > 0);
}

const ChatSidebar: React.FC = () => {
  const { 
    chats, activeChatId, isLoadingChats, hasMoreChats, selectChat, 
    createNewChat, deleteChat, loadMoreChats, setIsMobileMenuOpen, isGuest 
  } = useChat();
  const { t } = useTranslation();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuFlipUp, setMenuFlipUp] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [deleteModalChat, setDeleteModalChat] = useState<ChatSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  const grouped = useMemo(() => groupChatsByDate(filteredChats), [filteredChats]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('.chat-menu-btn') || target.closest('.chat-menu-dropdown')) return;
      setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (chatId: string, title: string) => {
    setIsDownloading(true);
    try {
      const res = await clientFetch(`/api/chat/${chatId}`);
      const data = await res.json();
      if (data.chat) {
        const messages = data.chat.messages || [];
        let text = `AstraNavi Chat — "${title}"\n`;
        text += `Date: ${new Date(data.chat.createdAt).toLocaleString()}\n`;
        text += `================================\n\n`;
        messages.forEach((msg: ChatMessage) => {
          if (msg.type === 'system') return;
          const role = msg.type === 'user' ? 'You' : 'Navi';
          const cleanContent = msg.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
          text += `${role}: ${cleanContent}\n\n`;
        });
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Astranavi_Chat_${title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download chat', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalChat) return;
    setIsDeleting(true);
    await deleteChat(deleteModalChat.id);
    setIsDeleting(false);
    setDeleteModalChat(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          className="!border-secondary/20 !text-secondary font-semibold !py-1 gap-1 !text-[11px]"
          disabled={isGuest}
          onClick={() => {
            createNewChat();
            setIsMobileMenuOpen(false);
          }}
        >
          <Plus className="w-3 h-3" /> New Chat
        </Button>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-on-surface-variant/50 hover:text-secondary rounded-lg transition-all shrink-0 !min-w-0 !min-h-0"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-3 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5 bg-surface/70 border border-outline-variant/20 rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-foreground/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-foreground/30 hover:text-foreground !min-w-0 !min-h-0 !p-0">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col relative">
        {isGuest && (
          <div className="absolute inset-0 z-50 backdrop-blur-[2px] bg-surface/40 flex flex-col items-center justify-center p-4 text-center">
            <Lock className="w-8 h-8 text-secondary/40 mb-3" />
            <p className="text-xs font-bold text-primary mb-1.5">History Locked</p>
            <p className="text-[10px] text-on-surface-variant/50 mb-5 leading-relaxed">Login to save your conversations.</p>
            <Button href="/login" size="sm" className="gold-gradient w-full !text-[11px]">Login to Unlock</Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-2 no-scrollbar" ref={scrollContainerRef}>
          {isLoadingChats && chats.length === 0 ? (
            <div className="flex flex-col gap-1.5 mt-1 px-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="px-2 py-1.5 rounded-lg space-y-1.5">
                  <Skeleton height={12} width="85%" />
                  <Skeleton height={8} width="35%" />
                </div>
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="text-secondary opacity-40 w-4 h-4" />
              </div>
              <p className="text-[12px] font-semibold text-on-surface-variant/40">{searchQuery ? 'No matching chats' : 'No chats yet'}</p>
              <p className="text-[11px] text-on-surface-variant/25 mt-1.5 leading-relaxed">
                {searchQuery ? 'Try a different search term.' : 'Start a new conversation above.'}
              </p>
            </div>
          ) : (
            <>
              {grouped.map((group) => (
                <div key={group.label} className="mb-2">
                  <p className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-wider px-2 py-1.5">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.chats.map((chat) => {
                      const isActive = chat.id === activeChatId;
                      return (
                        <div
                          key={chat.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => { selectChat(chat.id); setIsMobileMenuOpen(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectChat(chat.id); setIsMobileMenuOpen(false); }}}
                          className={`group relative px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-secondary/15 text-secondary font-semibold border border-secondary/20'
                              : 'hover:bg-surface-variant/30 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <p className={`text-[13px] leading-tight truncate flex-1 ${isActive ? 'text-secondary font-semibold' : 'text-foreground/80'}`}>
                              {chat.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[11px] ${isActive ? 'text-secondary/50' : 'text-foreground/40'}`}>{formatChatDate(chat.updatedAt || chat.createdAt, t)}</span>
                              <button
                                ref={menuBtnRef}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextId = menuOpenId === chat.id ? null : chat.id;
                                  setMenuOpenId(nextId);
                                  if (nextId && menuBtnRef.current && scrollContainerRef.current) {
                                    const btnRect = menuBtnRef.current.getBoundingClientRect();
                                    const containerRect = scrollContainerRef.current.getBoundingClientRect();
                                    setMenuFlipUp((btnRect.top - containerRect.top) > containerRect.height * 0.6);
                                  }
                                }}
                                className="chat-menu-btn text-foreground/25 hover:text-foreground/50 w-7 h-7 md:w-5 md:h-5 flex items-center justify-center !min-w-0 !min-h-0 !p-0 rounded transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100"
                              >
                                <MoreVertical size={12} />
                              </button>
                            </div>
                          </div>

                          {menuOpenId === chat.id && (
                            <div className={`chat-menu-dropdown absolute right-1 w-24 bg-background border border-outline-variant/15 rounded-lg shadow-xl z-50 py-0.5 ${menuFlipUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDownload(chat.id, chat.title); }}
                                className="w-full text-left px-2 py-1.5 text-[12px] text-foreground/60 hover:bg-surface-variant/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download size={11} /> Download
                              </button>
                              <div className="h-px bg-outline-variant/10 mx-1.5" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDeleteModalChat(chat); }}
                                className="w-full text-left px-2 py-1.5 text-[12px] text-red-400 hover:bg-red-400/10 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {hasMoreChats && (
                <button
                  onClick={loadMoreChats}
                  disabled={isLoadingChats}
                  className="w-full mt-1.5 py-1.5 text-[11px] font-semibold text-secondary/60 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingChats ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {deleteModalChat && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-surface border border-outline-variant/20 rounded-2xl p-6 w-[90%] max-w-[400px] shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-on-surface-variant/40 hover:text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/60 rounded-full p-1 transition-all cursor-pointer"
              onClick={() => setDeleteModalChat(null)}
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="w-12 h-12 bg-red-400/10 text-red-400 flex items-center justify-center rounded-full mb-4 ring-4 ring-red-400/5">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Delete Chat Forever?</h3>
              <p className="text-[14px] text-on-surface-variant/70 leading-relaxed mb-4">
                This will permanently delete <strong>&quot;{deleteModalChat.title}&quot;</strong>.
              </p>
              
              <div className="w-full bg-surface-variant/30 border border-outline-variant/10 rounded-lg p-3 mb-2">
                <p className="text-[13px] text-foreground/60 mb-2">Want a backup first?</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="gap-2 text-[13px]"
                  onClick={() => handleDownload(deleteModalChat.id, deleteModalChat.title)}
                  disabled={isDownloading}
                >
                  <Download size={14} />
                  {isDownloading ? 'Downloading...' : 'Save & Download'}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 !bg-surface-variant !text-on-surface hover:!bg-surface-variant/80" onClick={() => setDeleteModalChat(null)}>
                Cancel
              </Button>
              <Button className="flex-1 !bg-red-500/90 !text-white hover:!bg-red-500 border-none" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
