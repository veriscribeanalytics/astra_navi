import { useChat } from '@/context/ChatContext';
import { Menu, Info, History } from 'lucide-react';

interface ChatHeaderProps { }

const ChatHeader: React.FC<ChatHeaderProps> = () => {
  const { setIsMobileMenuOpen, setIsRightPanelOpen } = useChat();

  return (
    <div className="chat-main-header">
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile History Toggle (Left of Navi) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            console.log("NAVIGATING TO HISTORY...");
            setIsMobileMenuOpen(true);
          }}
          className="lg:hidden p-2 -ml-2 text-primary/60 hover:text-secondary transition-all active:scale-95"
          aria-label="View history"
        >
          <History className="w-5.5 h-5.5" />
        </button>

        {/* AI Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-sm sm:text-base">
          ✦
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface truncate max-w-[120px] sm:max-w-none">Navi — AI Astrologer</p>
          <p className="text-[10px] sm:text-[11px] text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            <span className="hidden xs:inline">Online · Responds instantly</span>
            <span className="xs:hidden">Online</span>
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 sm:gap-2 items-center">
        <div className="hidden sm:flex gap-1.5 sm:gap-2">
          <button className="chat-header-btn">
            <span className="material-symbols-outlined text-sm">share</span>
            <span className="hidden md:inline">Share</span>
          </button>
          <button className="chat-header-btn">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            <span className="hidden md:inline">Export PDF</span>
          </button>
        </div>
        
        <button className="chat-header-btn-gold whitespace-nowrap text-[10px] sm:text-xs">
          <span className="hidden sm:inline">View full Kundli ✦</span>
          <span className="sm:hidden">Kundli ✦</span>
        </button>

        {/* Info Toggle for Right Sidebar - HIDDEN ON MOBILE AS REQUESTED */}
        <button 
          onClick={() => setIsRightPanelOpen(true)}
          className="hidden xl:flex p-1.5 text-secondary/70 hover:text-secondary transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
