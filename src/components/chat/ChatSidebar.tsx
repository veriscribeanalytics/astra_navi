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
import { useTranslation, useFocusTrap } from '@/hooks';

function formatChatDate(dateStr: string, t: (key: string) => string): string {
  return formatChatTimestamp(dateStr, t('dashboard.yesterday') || undefined);
}

function groupChatsByDate(chats: ChatSummary[], t: (key: string) => string): { label: string; chats: ChatSummary[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; chats: ChatSummary[] }[] = [
    { label: t('chat.sidebar.today'), chats: [] },
    { label: t('chat.sidebar.yesterday'), chats: [] },
    { label: t('chat.sidebar.previous7Days'), chats: [] },
    { label: t('chat.sidebar.older'), chats: [] },
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
  const deleteModalRef = useFocusTrap<HTMLDivElement>(!!deleteModalChat);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  const grouped = useMemo(() => groupChatsByDate(filteredChats, t), [filteredChats, t]);

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

  const handleDownloadJSON = async (chatId: string, title: string) => {
    setIsDownloading(true);
    try {
      const res = await clientFetch(`/api/chat/${chatId}`);
      const data = await res.json();
      if (data.chat) {
        const exportData = {
          title: data.chat.title,
          createdAt: data.chat.createdAt,
          updatedAt: data.chat.updatedAt,
          averageRating: data.chat.averageRating,
          messages: data.chat.messages.map((m: ChatMessage) => ({
            id: m.id,
            type: m.type,
            text: m.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '),
            createdAt: m.createdAt,
            rating: m.rating,
            ...(m.insights ? { insights: m.insights } : {}),
            ...(m.suggestedQuestions ? { suggestedQuestions: m.suggestedQuestions } : {}),
            ...(m.pinned ? { pinned: m.pinned } : {}),
            ...(m.edited ? { edited: m.edited } : {}),
          })),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Astranavi_Chat_${title.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download chat as JSON', err);
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
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          className="!border-secondary/30 !text-secondary !bg-secondary/8 hover:!bg-secondary/15 hover:!border-secondary/50 font-bold !py-2.5 gap-1.5 !text-[13px] !rounded-xl"
          disabled={isGuest}
          onClick={() => {
            createNewChat();
            setIsMobileMenuOpen(false);
          }}
        >
          <Plus className="w-4 h-4" /> {t('chat.sidebar.newChat')}
        </Button>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden chat-sidebar-close-btn text-on-surface-variant/50 hover:text-secondary rounded-lg transition-all shrink-0 flex items-center justify-center"
          aria-label={t('chat.sidebar.close')}
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-3 pb-1.5 shrink-0">
        <div className="flex items-center gap-2 bg-surface/70 border border-outline-variant/20 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-foreground/40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.sidebar.searchPlaceholder')}
            className="w-full min-w-0 bg-transparent border-none outline-none text-[13px] sm:text-[14px] text-foreground placeholder:text-foreground/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="w-6 h-6 flex items-center justify-center rounded-md text-foreground/30 hover:text-foreground shrink-0"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col relative">
        {isGuest && (
          <div className="absolute inset-0 z-50 backdrop-blur-[2px] bg-surface/40 flex flex-col items-center justify-center p-4 text-center">
            <Lock className="w-8 h-8 text-secondary/40 mb-3" />
            <p className="text-xs font-bold text-primary mb-1.5">{t('chat.sidebar.historyLocked')}</p>
            <p className="text-[10px] text-on-surface-variant/50 mb-5 leading-relaxed">{t('chat.sidebar.loginToSave')}</p>
            <Button href="/login" size="sm" className="gold-gradient w-full !text-[11px]">{t('chat.sidebar.loginToUnlock')}</Button>
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
              <p className="text-[12px] font-semibold text-on-surface-variant/40">{searchQuery ? t('chat.sidebar.noMatchingChats') : t('chat.sidebar.noChatsYet')}</p>
              <p className="text-[11px] text-on-surface-variant/25 mt-1.5 leading-relaxed">
                {searchQuery ? t('chat.sidebar.tryDifferentSearch') : t('chat.sidebar.startNewConversation')}
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
                        <button
                          key={chat.id}
                          onClick={() => { selectChat(chat.id); setIsMobileMenuOpen(false); }}
                          className={`group relative ${isActive ? 'sidebar-chat-active' : 'sidebar-chat-item'} cursor-pointer text-left w-full`}
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
                                className="chat-sidebar-menu-btn chat-menu-btn text-foreground/25 hover:text-foreground/50 lg:w-5 lg:h-5 flex items-center justify-center !p-0 rounded transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100"
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
                                <Download size={11} /> {t('chat.sidebar.downloadTxt')}
                              </button>
                              <div className="h-px bg-outline-variant/10 mx-1.5" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDownloadJSON(chat.id, chat.title); }}
                                className="w-full text-left px-2 py-1.5 text-[12px] text-foreground/60 hover:bg-surface-variant/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download size={11} /> {t('chat.sidebar.downloadJson')}
                              </button>
                              <div className="h-px bg-outline-variant/10 mx-1.5" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDeleteModalChat(chat); }}
                                className="w-full text-left px-2 py-1.5 text-[12px] text-red-400 hover:bg-red-400/10 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={11} /> {t('chat.sidebar.delete')}
                              </button>
                            </div>
                          )}
                        </button>
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
                  {isLoadingChats ? t('chat.sidebar.loading') : t('chat.sidebar.loadMore')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {deleteModalChat && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div ref={deleteModalRef} className="bg-surface border border-outline-variant/20 rounded-2xl p-6 w-[90%] max-w-[400px] shadow-2xl relative">
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
              <h3 className="text-lg font-bold text-on-surface mb-2">{t('chat.sidebar.deleteChatForever')}</h3>
              <p className="text-[14px] text-on-surface-variant/70 leading-relaxed mb-4">
                {t('chat.sidebar.deletePermanentWarning')} <strong>&quot;{deleteModalChat.title}&quot;</strong>.
              </p>
              
              <div className="w-full bg-surface-variant/30 border border-outline-variant/10 rounded-lg p-3 mb-2">
                <p className="text-[13px] text-foreground/60 mb-2">{t('chat.sidebar.wantBackupFirst')}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="gap-2 text-[13px]"
                  onClick={() => handleDownload(deleteModalChat.id, deleteModalChat.title)}
                  disabled={isDownloading}
                >
                  <Download size={14} />
                  {isDownloading ? t('chat.sidebar.downloading') : t('chat.sidebar.saveAndDownload')}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 !bg-surface-variant !text-on-surface hover:!bg-surface-variant/80" onClick={() => setDeleteModalChat(null)}>
                {t('chat.sidebar.cancel')}
              </Button>
              <Button className="flex-1 !bg-red-500/90 !text-white hover:!bg-red-500 border-none" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? t('chat.sidebar.deleting') : t('chat.sidebar.deleteConfirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
