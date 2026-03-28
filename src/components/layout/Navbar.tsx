'use client';

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { User, LogOut } from "lucide-react";

interface INavbarProps{}

const navItems = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "about",
    label: "About Us",
    href: "/about",
  },
  {
    id: "chat",
    label: "Chat with AI",
    href: "/chat",
  },
  {
    id: "plans",
    label: "Plans",
    href: "/plans",
  },
];

const Navbar: React.FunctionComponent<INavbarProps> = (props) => {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout, showLoading, user } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsDropdownOpen(false);
        showLoading("Returning to the stars...", 1500);
        setTimeout(() => {
            logout();
            router.push('/login');
        }, 1500);
    };
    
    const isActive = (path:string) => pathname == path;

    return(
        <nav className="fixed top-0 w-full z-[110] bg-background/80 backdrop-blur-md border-b border-secondary/10">
            <div className="flex justify-between items-center px-4 sm:px-8 lg:px-12 py-4 w-full mx-auto">
                <Link
                    href="/"
                    className="flex shrink-0 items-center justify-center text-2xl font-bold tracking-tighter text-primary font-headline"
                >
                    <Image
                        src="/icons/logo.jpeg"
                        alt="Astra Navi Logo"
                        height={32}
                        width={32}
                        className="object-contain mr-2"
                        priority
                    />
                    Astra Navi
                </Link>
                <div className="hidden md:flex items-center space-x-8 font-body font-medium tracking-wide text-sm">
                    {navItems
                        .filter(item => item.id !== 'chat' || isLoggedIn)
                        .map((eachItem) => (
                        <Link
                            key={eachItem.id}
                            href={eachItem.href}
                            className={`transition-all duration-300 ${
                                isActive(eachItem.href) 
                                    ? "text-primary border-b-2 border-secondary pb-1" 
                                    : "text-primary/70 hover:text-primary"
                            }`}
                        >
                            {eachItem.label}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <ThemeToggle />
                    <Button
                        href="/shop"
                        variant="secondary"
                        size="sm"
                        className="hidden sm:inline-flex !h-[34px] !px-4 !text-xs"
                    >
                        Shop
                    </Button>
                    {!isLoggedIn ? (
                        <Button
                            href="/login"
                            variant="primary"
                            size="md"
                            className="hidden sm:inline-flex"
                        >
                            Login
                        </Button>
                    ) : (
                        <div className="flex items-center space-x-4 relative z-50" ref={dropdownRef}>
                            <div 
                                className="profile-ring-glow cursor-pointer relative"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                title="Account Menu"
                            >
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content text-lg">
                                    {(user?.email?.[0] || 'S').toUpperCase()}
                                </div>
                            </div>

                            {/* The Glassmorphic Dropdown */}
                            {isDropdownOpen && (
                                <div className="absolute top-[56px] right-0 w-56 bg-background/95 backdrop-blur-xl border border-[#D4AF37]/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 mb-2 border-b border-[var(--border)]">
                                        <p className="text-xs text-foreground/50 uppercase tracking-widest font-mono">Signed in as</p>
                                        <p className="text-sm font-semibold text-foreground/90 truncate">{user?.email || "Seeker"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Link 
                                            href="/profile" 
                                            onClick={() => setIsDropdownOpen(false)} 
                                            className="w-full flex items-center px-4 py-2.5 text-sm text-foreground/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl transition-all"
                                        >
                                            <User className="w-4 h-4 mr-3 opacity-70" />
                                            Profile Settings
                                        </Link>
                                        <button 
                                            onClick={handleLogout} 
                                            className="w-full flex items-center px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all"
                                        >
                                            <LogOut className="w-4 h-4 mr-3 opacity-70" />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}    

export default Navbar;
