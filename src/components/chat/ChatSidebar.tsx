'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import SidebarSectionLabel from '@/components/ui/SidebarSectionLabel';
import { useChat, ChatSummary } from '@/context/ChatContext';
import { 
    MoreVertical, Trash2, Download, 
    AlertTriangle, X, MessageSquare, Plus, Lock
} from 'lucide-react';
import { formatChatTimestamp } from '@/lib/datetime';

/* ---------- Date Formatter ---------- */
function formatChatDate(dateStr: string): string {
  return formatChatTimestamp(dateStr);
}

const ChatSidebar: React.FC = () => {
  const { 
    chats, activeChatId, isLoadingChats, hasMoreChats, selectChat, 
    createNewChat, deleteChat, loadMoreChats, setIsMobileMenuOpen, isGuest 
  } = useChat();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteModalChat, setDeleteModalChat] = useState<ChatSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('.chat-menu-btn') || target.closest('.chat-menu-dropdown')) {
        return;
      }
      setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (chatId: string, title: string) => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/chat/${chatId}`);
      const data = await res.json();
      if (data.chat) {
        const messages = data.chat.messages || [];
        let text = `AstraNavi Chat — "${title}"\n`;
        text += `Date: ${new Date(data.chat.createdAt).toLocaleString()}\n`;
        text += `================================\n\n`;

        messages.forEach((msg: any) => {
          if (msg.type === 'system') return;
          const role = msg.type === 'user' ? 'You' : 'Navi';
          // Strip HTML tags from AI messages
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
      {/* Header / New Chat Row */}
      <div className="flex items-center gap-2 px-3.5 pt-4 pb-2 shrink-0">
        <div className="flex-1 min-w-0">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            className="!border-secondary/25 !text-secondary !font-bold gap-1.5"
            disabled={isGuest}
            onClick={() => {
              createNewChat();
              setIsMobileMenuOpen(false);
            }}
          >
            <Plus className="w-3.5 h-3.5" /> New conversation
          </Button>
        </div>
        
        {/* Sidebar Close Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(false);
          }}
          className="lg:hidden p-1.5 text-on-surface-variant/50 hover:text-secondary hover:bg-secondary/10 rounded-full transition-all shrink-0 flex items-center justify-center !min-w-0 !min-h-0"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Recent Chats (Scrollable Area) */}
      <div className="flex-1 min-h-0 flex flex-col pt-4 relative">
        {isGuest && (
          <div className="absolute inset-0 z-50 backdrop-blur-[2px] bg-surface/40 flex flex-col items-center justify-center p-6 text-center">
            <Lock className="w-10 h-10 text-secondary/40 mb-4" />
            <p className="text-sm font-bold text-primary mb-2">History Locked</p>
            <p className="text-[11px] text-on-surface-variant/60 mb-6 leading-relaxed">Login to save your celestial conversations and access them later.</p>
            <Button href="/login" size="sm" className="gold-gradient w-full">Login to Unlock</Button>
          </div>
        )}
        <div className="px-3.5 mb-1 shrink-0 flex items-center justify-between">
          <SidebarSectionLabel>RECENT CHATS</SidebarSectionLabel>
        </div>
        <div className="flex-1 overflow-y-auto px-3.5 pb-2">
          {isLoadingChats && chats.length === 0 ? (
            <div className="flex flex-col gap-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-surface-variant/30" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <MessageSquare className="text-secondary opacity-40 w-6 h-6" />
              </div>
              <p className="text-[14px] font-bold text-on-surface-variant/50 uppercase tracking-widest">No chats yet</p>
              <p className="text-[12px] text-on-surface-variant/30 mt-2 leading-relaxed">
                Your celestial conversations will appear here. Start a new reading above!
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                {chats.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  return (
                    <div
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                          selectChat(chat.id);
                          setIsMobileMenuOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          selectChat(chat.id);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`group relative px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        menuOpenId === chat.id ? 'z-50' : 'z-0'
                      } ${
                        isActive
                          ? 'bg-surface-variant/60 border border-secondary/20 shadow-sm shadow-secondary/5'
                          : 'hover:bg-surface-variant/30 border border-transparent'
                      }`}
                    >
                      <p className={`text-[15px] truncate mb-0.5 transition-all duration-200 ${
                        isActive ? 'text-secondary font-bold pr-3' : 'text-on-surface-variant font-medium pr-3 md:pr-0 md:group-hover:pr-3'
                      }`}>
                        {chat.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-on-surface-variant/40">
                          {formatChatDate(chat.updatedAt || chat.createdAt)}
                        </p>
                        {chat.averageRating != null && (
                          <span className="text-[11px] text-secondary/70 flex items-center gap-0.5">
                            ★ {chat.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {/* Gradient mask to gracefully fade text behind the 3-dot button */}
                      <div 
                        className={`absolute right-0 top-0 bottom-0 w-16 pointer-events-none transition-all duration-200 rounded-r-xl z-10 bg-gradient-to-l to-transparent ${
                          isActive 
                            ? 'opacity-100 from-[color-mix(in_srgb,var(--surface-variant)_60%,var(--surface))]' 
                            : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 from-surface group-hover:from-[color-mix(in_srgb,var(--surface-variant)_30%,var(--surface))]'
                        }`}
                      />
                      
                      <div 
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-200 ${
                          isActive ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                        }`}
                      >
                          <button 
                              onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setMenuOpenId(prev => prev === chat.id ? null : chat.id);
                              }}
                              className="chat-menu-btn text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-surface-variant/50 w-7 h-7 flex items-center justify-center !min-w-0 !min-h-0 !p-1 rounded transition-colors cursor-pointer"
                          >
                              <MoreVertical size={14} />
                          </button>
                          
                          {menuOpenId === chat.id && (
                            <div className="chat-menu-dropdown absolute top-full right-0 mt-1 w-32 bg-background border border-outline-variant/20 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                  handleDownload(chat.id, chat.title);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[14px] font-bold text-on-surface-variant hover:bg-surface-variant/40 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Download size={13} /> Download
                              </button>
                              <div className="h-px bg-outline-variant/10 my-1 mx-2" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                  setDeleteModalChat(chat);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[14px] font-bold text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Load More Button */}
              {hasMoreChats && (
                <button
                  onClick={loadMoreChats}
                  disabled={isLoadingChats}
                  className="w-full mt-2 py-2 text-xs font-bold text-secondary hover:bg-secondary/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingChats ? 'Loading...' : 'Load More Chats'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalChat && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/20 rounded-2xl p-6 w-[90%] max-w-[400px] shadow-2xl relative animate-in zoom-in-95 duration-200">
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
              <p className="text-[15px] text-on-surface-variant/70 leading-relaxed mb-4">
                This will permanently delete <strong>&quot;{deleteModalChat.title}&quot;</strong>.<br/>This action cannot be undone.
              </p>
              
              <div className="w-full bg-surface-variant/30 border border-outline-variant/10 rounded-xl p-4 mb-2">
                <p className="text-[14px] text-on-surface-variant/80 font-medium mb-3">Want to make a backup before deleting?</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="gap-2 text-[13px]"
                  onClick={() => handleDownload(deleteModalChat.id, deleteModalChat.title)}
                  disabled={isDownloading}
                >
                  <Download size={14} />
                  {isDownloading ? 'Downloading...' : 'Save & Download Chat'}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1 !bg-surface-variant !text-on-surface hover:!bg-surface-variant/80"
                onClick={() => setDeleteModalChat(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 !bg-red-500/90 !text-white hover:!bg-red-500 border-none"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
