"use client";

import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks";
import { useAuth } from "@/context/AuthContext";

export default function AskNaviFab() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const { user } = useAuth();

    if (!user || pathname === "/chat" || pathname?.startsWith("/chat")) return null;

    return (
        <Link
            href="/chat"
            className="fixed bottom-6 right-5 z-[1000] lg:hidden flex items-center gap-2 py-3.5 px-5 rounded-full bg-[#c8991f] text-white font-semibold text-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.18)] active:scale-95 transition-transform"
        >
            <MessageSquare size={18} />
            {t("dashboard.askNaviFab")}
            <ArrowRight size={16} />
        </Link>
    );
}