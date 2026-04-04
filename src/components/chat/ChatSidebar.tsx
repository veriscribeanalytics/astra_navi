'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import SidebarSectionLabel from '@/components/ui/SidebarSectionLabel';
import { useChat, ChatSummary } from '@/context/ChatContext';
import { MoreVertical, Trash2, Download, AlertTriangle, X } from 'lucide-react';

/* ---------- Date Formatter ---------- */
function formatChatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ChatSidebar: React.FC = () => {
  const { chats, activeChatId, isLoadingChats, selectChat, createNewChat, deleteChat, setIsMobileMenuOpen } = useChat();
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
        const text = JSON.stringify(data.chat, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Astranavi_ChatBackup_${title.replace(/\s+/g, '_')}.json`;
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
    await deleteChat(deleteModalChat._id);
    setIsDeleting(false);
    setDeleteModalChat(null);
  };

  return (
    <>
      {/* Sidebar Close Button (Top right of side area) */}
      <button 
        onClick={() => setIsMobileMenuOpen(false)}
        className="lg:hidden absolute top-4 right-4 p-2 text-on-surface-variant/40 hover:text-secondary hover:bg-secondary/10 rounded-full transition-all z-[1001]"
        aria-label="Close sidebar"
      >
        <X className="w-5 h-5" />
      </button>

      {/* New Chat Button Row */}
      <div className="px-3.5 pt-4 pb-2 shrink-0 pr-12"> {/* Added padding-right to avoid the X button */}
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          className="!border-secondary/25 !text-secondary !font-bold gap-1.5"
          onClick={() => {
            createNewChat();
            setIsMobileMenuOpen(false);
          }}
        >
          <span>✦</span> New conversation
        </Button>
      </div>

      {/* Recent Chats (Scrollable Area) */}
      <div className="flex-1 min-h-0 flex flex-col pt-4">
        <div className="px-3.5 mb-1 shrink-0 flex items-center justify-between">
          <SidebarSectionLabel>RECENT CHATS</SidebarSectionLabel>
        </div>
        <div className="flex-1 overflow-y-auto px-3.5 pb-2 custom-scrollbar">
          {isLoadingChats ? (
            <div className="flex flex-col gap-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-surface-variant/30" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="material-symbols-outlined text-secondary opacity-40">chat_bubble</span>
              </div>
              <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">No chats yet</p>
              <p className="text-[10px] text-on-surface-variant/30 mt-2 leading-relaxed">
                Your celestial conversations will appear here. Start a new reading above!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {chats.map((chat) => {
                const isActive = chat._id === activeChatId;
                return (
                  <div
                    key={chat._id}
                    onClick={() => {
                        selectChat(chat._id);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`group relative px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 pr-8 ${
                      isActive
                        ? 'bg-secondary/8 border border-secondary/20 shadow-sm shadow-secondary/5'
                        : 'hover:bg-surface-variant/30 border border-transparent'
                    }`}
                  >
                    <p className={`text-[13px] truncate mb-0.5 ${
                      isActive ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                    }`}>
                      {chat.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-on-surface-variant/40">
                        {formatChatDate(chat.updatedAt || chat.createdAt)}
                      </p>
                      {chat.averageRating != null && (
                        <span className="text-[9px] text-secondary/70 flex items-center gap-0.5">
                          ★ {chat.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    
                    {/* ... (3-dot menu) ... */}
                    <div 
                      className={`absolute right-2 top-2 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    >
                        <button 
                            onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setMenuOpenId(prev => prev === chat._id ? null : chat._id);
                            }}
                            className="chat-menu-btn text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded transition-colors cursor-pointer"
                        >
                            <MoreVertical size={14} />
                        </button>
                        {/* Dropdown would be here as before */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SITE NAVIGATION (Mobile Only) */}
        <div className="lg:hidden px-3.5 pt-4 pb-6 border-t border-outline-variant/10 bg-surface/50">
            <SidebarSectionLabel>SITE NAVIGATION</SidebarSectionLabel>
            <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                    { label: 'Home', href: '/' },
                    { label: 'About', href: '/about' },
                    { label: 'Plans', href: '/plans' },
                    { label: 'Profile', href: '/profile' }
                ].map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-background border border-outline-variant/10 text-[11px] font-bold text-primary/70 hover:text-primary transition-all active:scale-95 shadow-sm"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalChat && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-outline-variant/20 rounded-2xl p-6 w-[90%] max-w-[400px] shadow-2xl relative animate-in zoom-in-95 duration-200">
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
              <p className="text-[13px] text-on-surface-variant/70 leading-relaxed mb-4">
                This will permanently delete <strong>&quot;{deleteModalChat.title}&quot;</strong>.<br/>This action cannot be undone.
              </p>
              
              <div className="w-full bg-surface-variant/30 border border-outline-variant/10 rounded-xl p-4 mb-2">
                <p className="text-[12px] text-on-surface-variant/80 font-medium mb-3">Want to make a backup before deleting?</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="gap-2 !text-xs"
                  onClick={() => handleDownload(deleteModalChat._id, deleteModalChat.title)}
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
